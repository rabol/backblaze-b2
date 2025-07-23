import React, { useState, useEffect } from 'react';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardTitle,
    Form,
    FormGroup,
    Grid,
    GridItem,
    Page,
    PageSection,
    TextArea,
    TextInput,
    Title,
    Divider
} from '@patternfly/react-core';

import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@patternfly/react-table';

import cockpit from 'cockpit';

const _ = cockpit.gettext;
const JOBS_FILE = '/etc/backblaze-b2/jobs.json';

type Job = {
    keyId: string;
    appKey: string;
    bucket: string;
    folder: string;
};

export const Application = () => {
    const [keyId, setKeyId] = useState('');
    const [appKey, setAppKey] = useState('');
    const [bucket, setBucket] = useState('');
    const [folder, setFolder] = useState('/tank_ssd/shared');
    const [output, setOutput] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = () => {
        cockpit.file(JOBS_FILE, { superuser: true }).read()
            .then(content => {
                try {
                    setJobs(JSON.parse(content));
                } catch {
                    setJobs([]);
                }
            })
            .catch(() => {
                setJobs([]);
            });
    };

    const saveJobs = (newJobs: Job[]) => {
        cockpit.file(JOBS_FILE, { superuser: true }).replace(JSON.stringify(newJobs, null, 2))
            .done(() => setJobs(newJobs))
            .fail(err => {
                setOutput(_('Error saving job: ') + (err.message || err));
            });
    };

    const handleSaveJob = () => {
        const newJob: Job = { keyId, appKey, bucket, folder };
        const updatedJobs = [...jobs, newJob];
        saveJobs(updatedJobs);
        setOutput(_('Job saved.'));
    };

    const handleDeleteJob = (index: number) => {
        if (!window.confirm(_('Are you sure you want to delete this job?'))) {
            return;
        }
        const updatedJobs = [...jobs];
        updatedJobs.splice(index, 1);
        saveJobs(updatedJobs);
        setOutput(_('Job deleted.'));
    };

    const handleRunJob = (job: Job) => {
        setOutput(_('Running backup...'));
        cockpit
            .spawn(['/usr/libexec/backblaze-b2/sync.sh', job.keyId, job.appKey, job.bucket, job.folder], {
                superuser: 'require'
            })
            .done((data: string) => {
                setOutput(data);
            })
            .fail((err: any) => {
                setOutput(_('Backup failed: ') + (err.message || err));
            });
    };

    return (
        <Page>
            <PageSection variant="light">
                <Card>
                    <CardTitle>{_('Backblaze B2 Backup')}</CardTitle>
                    <CardBody>
                        <Form isHorizontal>
                            <Grid hasGutter>
                                <GridItem span={6}>
                                    <FormGroup label={_('Application Key ID')} fieldId="keyId">
                                        <TextInput id="keyId" value={keyId} onChange={(_, v) => setKeyId(v)} />
                                    </FormGroup>
                                </GridItem>
                                <GridItem span={6}>
                                    <FormGroup label={_('Application Key')} fieldId="appKey">
                                        <TextInput
                                            id="appKey"
                                            type="password"
                                            value={appKey}
                                            onChange={(_, v) => setAppKey(v)}
                                        />
                                    </FormGroup>
                                </GridItem>

                                <GridItem span={6}>
                                    <FormGroup label={_('Bucket Name')} fieldId="bucket">
                                        <TextInput id="bucket" value={bucket} onChange={(_, v) => setBucket(v)} />
                                    </FormGroup>
                                </GridItem>
                                <GridItem span={6}>
                                    <FormGroup label={_('Local Folder to Backup')} fieldId="folder">
                                        <TextInput id="folder" value={folder} onChange={(_, v) => setFolder(v)} />
                                    </FormGroup>
                                </GridItem>
                            </Grid>

                            <Button variant="primary" onClick={handleSaveJob} style={{ marginTop: '10px' }}>
                                {_('Save Job')}
                            </Button>
                        </Form>

                        <FormGroup label={_('Output')} fieldId="output" style={{ marginTop: '20px' }}>
                            <TextArea id="output" value={output} isReadOnly rows={10} />
                        </FormGroup>

                        <Divider style={{ margin: '20px 0' }} />
                        <Title headingLevel="h2" size="lg">
                            {_('Saved Jobs')}
                        </Title>

                        <Table variant="compact" style={{ marginTop: '10px' }}>
                            <Thead>
                                <Tr>
                                    <Th>{_('Bucket')}</Th>
                                    <Th>{_('Folder')}</Th>
                                    <Th>{_('Actions')}</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {jobs.map((job, index) => (
                                    <Tr key={index}>
                                        <Td>{job.bucket}</Td>
                                        <Td>{job.folder}</Td>
                                        <Td>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleRunJob(job)}
                                                style={{ marginRight: '8px' }}
                                            >
                                                {_('Run')}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setKeyId(job.keyId);
                                                    setAppKey(job.appKey);
                                                    setBucket(job.bucket);
                                                    setFolder(job.folder);
                                                }}
                                                style={{ marginRight: '8px' }}
                                            >
                                                {_('Edit')}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteJob(index)}
                                            >
                                                {_('Delete')}
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </CardBody>
                </Card>
            </PageSection>
        </Page>
    );
};