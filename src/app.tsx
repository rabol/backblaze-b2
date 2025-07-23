import cockpit from 'cockpit';
import React, { useEffect, useState } from 'react';
import {
    Page, PageSection, Title, TextInput, Button, Form, FormGroup, Alert, Flex, FlexItem,
    Table, Thead, Tbody, Tr, Th, Td
} from '@patternfly/react-core';

import { encrypt, decrypt } from './encrypt';

type Job = {
    applicationKeyId: string;
    applicationKey: string;
    bucket: string;
    localFolder: string;
};

const JOBS_FILE = '/etc/backblaze-b2/jobs.json';

const App = () => {
    const [applicationKeyId, setApplicationKeyId] = useState('');
    const [applicationKey, setApplicationKey] = useState('');
    const [bucket, setBucket] = useState('');
    const [localFolder, setLocalFolder] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const result = await cockpit.file(JOBS_FILE, { superuser: true }).read();
            const parsed = JSON.parse(result);
            const decryptedJobs = parsed.map((job: any) => ({
                ...job,
                applicationKeyId: decrypt(job.applicationKeyId),
                applicationKey: decrypt(job.applicationKey)
            }));
            setJobs(decryptedJobs);
        } catch (err) {
            console.warn("Could not read jobs:", err);
        }
    };

    const saveJobs = async (newJobs: Job[]) => {
        try {
            const encryptedJobs = newJobs.map((job) => ({
                ...job,
                applicationKeyId: encrypt(job.applicationKeyId),
                applicationKey: encrypt(job.applicationKey)
            }));
            const json = JSON.stringify(encryptedJobs, null, 2);

            // Ensure directory exists
            await cockpit.spawn(['mkdir', '-p', '/etc/backblaze-b2'], { superuser: true });
            await cockpit.file(JOBS_FILE, { superuser: true }).replace(json);
            setSuccess('Job saved successfully.');
            setJobs(newJobs);
        } catch (err) {
            setError('Failed to save job: ' + err);
        }
    };

    const handleAddOrUpdate = () => {
        if (!applicationKeyId || !applicationKey || !bucket || !localFolder) {
            setError('All fields are required.');
            return;
        }

        const job: Job = { applicationKeyId, applicationKey, bucket, localFolder };
        const updatedJobs = [...jobs];

        if (selectedIndex !== null) {
            updatedJobs[selectedIndex] = job;
        } else {
            updatedJobs.push(job);
        }

        saveJobs(updatedJobs);
        resetForm();
    };

    const resetForm = () => {
        setApplicationKeyId('');
        setApplicationKey('');
        setBucket('');
        setLocalFolder('');
        setSelectedIndex(null);
        setError('');
        setSuccess('');
    };

    const handleDelete = (index: number) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        const updatedJobs = jobs.filter((_, i) => i !== index);
        saveJobs(updatedJobs);
    };

    const handleEdit = (index: number) => {
        const job = jobs[index];
        setApplicationKeyId(job.applicationKeyId);
        setApplicationKey(job.applicationKey);
        setBucket(job.bucket);
        setLocalFolder(job.localFolder);
        setSelectedIndex(index);
    };

    const handleRun = async (index: number) => {
        const job = jobs[index];
        try {
            const result = await cockpit.spawn([
                '/usr/libexec/backblaze-b2/sync.sh',
                job.applicationKeyId,
                job.applicationKey,
                job.bucket,
                job.localFolder
            ], { superuser: true });
            alert('Backup completed:\n' + result);
        } catch (err) {
            alert('Backup failed:\n' + err);
        }
    };

    return (
        <Page>
            <PageSection>
                <Title headingLevel="h1">Backblaze B2 Backup</Title>
                <Form>
                    <FormGroup label="Application ID and Key" isRequired>
                        <Flex>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextInput
                                    value={applicationKeyId}
                                    onChange={(_, value) => setApplicationKeyId(value)}
                                    placeholder="Application Key ID"
                                />
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextInput
                                    value={applicationKey}
                                    onChange={(_, value) => setApplicationKey(value)}
                                    placeholder="Application Key"
                                    type="password"
                                />
                            </FlexItem>
                        </Flex>
                    </FormGroup>
                    <FormGroup label="Bucket and Local Folder" isRequired>
                        <Flex>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextInput
                                    value={bucket}
                                    onChange={(_, value) => setBucket(value)}
                                    placeholder="Bucket Name"
                                />
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <TextInput
                                    value={localFolder}
                                    onChange={(_, value) => setLocalFolder(value)}
                                    placeholder="Local Folder"
                                />
                            </FlexItem>
                        </Flex>
                    </FormGroup>
                    <Button variant="primary" onClick={handleAddOrUpdate}>
                        {selectedIndex !== null ? 'Update Job' : 'Add Job'}
                    </Button>
                </Form>
                {error && <Alert variant="danger" title={error} />}
                {success && <Alert variant="success" title={success} />}
            </PageSection>

            <PageSection>
                <Title headingLevel="h2">Saved Jobs</Title>
                <Table variant="compact">
                    <Thead>
                        <Tr>
                            <Th>Key ID</Th>
                            <Th>Bucket</Th>
                            <Th>Local Folder</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {jobs.map((job, index) => (
                            <Tr key={index}>
                                <Td>{job.applicationKeyId}</Td>
                                <Td>{job.bucket}</Td>
                                <Td>{job.localFolder}</Td>
                                <Td>
                                    <Button size="sm" onClick={() => handleRun(index)}>Run</Button>{' '}
                                    <Button size="sm" onClick={() => handleEdit(index)}>Edit</Button>{' '}
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(index)}>Delete</Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </PageSection>
        </Page>
    );
};

export default App;