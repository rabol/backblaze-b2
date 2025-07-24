// src/app.tsx
import React, { useState, useEffect } from 'react';
import {
    Alert,
    AlertActionCloseButton,
    Button,
    Card,
    CardBody,
    CardTitle,
    Divider,
    Form,
    FormGroup,
    Grid,
    GridItem,
    Page,
    PageSection,
    Spinner,
    TextArea,
    TextInput,
    Title
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
import { loadConfig, getConfig } from './config';
import { encryptData, decryptData } from './encrypt';

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
    const [folder, setFolder] = useState('');
    const [output, setOutput] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [config, setConfig] = useState<Record<string, any> | null>(null);
    const [showAlert, setShowAlert] = useState(true);

    useEffect(() => {
        const init = async () => {
            await loadConfig();
            const loadedConfig = getConfig();
            setConfig(loadedConfig);
        };
        init();
    }, []);

    useEffect(() => {
        loadJobs();
        loadConfig().then(config => {
            setSecretKey(config.secretKey);
        });
    }, []);


    const loadJobs = async () => {
        try {
            const content = await cockpit.file(JOBS_FILE, { superuser: true }).read();
            const parsedJobs: Job[] = JSON.parse(content);

            const decryptedJobs: Job[] = parsedJobs.map((job) => ({
                ...job,
                keyId: decryptData(job.keyId, secretKey),
                appKey: decryptData(job.appKey, secretKey)
            }));

            setJobs(decryptedJobs);
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setOutput(_('Error loading jobs: ') + (err.message || err));
            setJobs([]);
        }
    };

    const saveJobs = async (newJobs: Job[]) => {
        try {
            const encryptedJobs: Job[] = newJobs.map((job) => ({
                ...job,
                keyId: encryptData(job.keyId, secretKey),
                appKey: encryptData(job.appKey, secretKey)
            }));

            await cockpit.file(JOBS_FILE, { superuser: true }).replace(JSON.stringify(encryptedJobs, null, 2));
            setJobs(newJobs);
        } catch (err: any) {
            console.error('Failed to save jobs:', err);
            setOutput(_('Error saving job: ') + (err.message || err));
        }
    };

    const handleSaveJob = async () => {
        if (!keyId || !appKey || !bucket || !folder) {

            setOutput(_('All fields are required.'));
            return;
        }

        const newJob: Job = { keyId, appKey, bucket, folder };

        let updatedJobs;
        if (editIndex !== null) {
            updatedJobs = [...jobs];
            updatedJobs[editIndex] = newJob;
        } else {
            updatedJobs = [...jobs, newJob];
        }

        await saveJobs(updatedJobs);
        setOutput(_('Job saved.'));

        // Clear form
        setKeyId('');
        setAppKey('');
        setBucket('');
        setFolder('');
        setEditIndex(null);
    };

    const handleCancelEdit = () => {
        setKeyId('');
        setAppKey('');
        setBucket('');
        setFolder('');
        setEditIndex(null);
        setOutput(_('Edit cancelled.'));
    };

    const handleDeleteJob = async (index: number) => {
        if (!window.confirm(_('Are you sure you want to delete this job?'))) return;
        const updatedJobs = [...jobs];
        updatedJobs.splice(index, 1);
        await saveJobs(updatedJobs);
        setOutput(_('Job deleted.'));
    };

    const handleRunJob = async (job: Job) => {
        if (!window.confirm(_('Are you sure you want to run this backup job?'))) return;

        setOutput(_('Running backup...'));
        setIsRunning(true);
        document.body.style.cursor = 'wait';

        try {
            const decryptedKeyId = decryptData(job.keyId, secretKey);
            const decryptedAppKey = decryptData(job.appKey, secretKey);

            cockpit
                .spawn(
                    [
                        '/usr/libexec/backblaze-b2/sync.sh',
                        decryptedKeyId,
                        decryptedAppKey,
                        job.bucket,
                        job.folder
                    ],
                    { superuser: 'require' }
                )
                .done((data: string) => {
                    setOutput(data);
                    setIsRunning(false);
                    document.body.style.cursor = 'default';
                })
                .fail((err: any) => {
                    setOutput(_('Backup failed: ') + (err.message || err));
                    setIsRunning(false);
                    document.body.style.cursor = 'default';
                });
        } catch (err: any) {
            console.error('Error decrypting job:', err);
            setOutput(_('Error decrypting job: ') + (err.message || err));
            setIsRunning(false);
            document.body.style.cursor = 'default';
        }
    };

    return (
        <Page className="no-masthead-sidebar" isContentFilled>
            <PageSection variant="light">
                <Card>
                    <CardTitle>{_('Backblaze B2 Backup')}</CardTitle>
                    <CardBody>
                        {/* Show output as an Alert if present */}
                        {output && (
                            <Alert
                                variant={
                                    output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')
                                        ? 'danger'
                                        : output.toLowerCase().includes('saved') || output.toLowerCase().includes('deleted')
                                            ? 'success'
                                            : 'info'
                                }
                                title={output}
                                isInline
                                style={{ marginBottom: '16px' }}
                                actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
                            />
                        )}

                        <Form isHorizontal>
                            {editIndex !== null && (
                                <div style={{ marginBottom: '10px', marginTop: '10px' }}>
                                    <Alert variant="info" title={_('Editing existing job')} isInline />
                                </div>
                            )}

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

                            <div style={{ marginTop: '10px' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveJob}
                                    style={{ marginRight: '10px' }}
                                    isDisabled={isRunning}
                                >
                                    {_('Save Job')}
                                </Button>
                                {editIndex !== null && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleCancelEdit}
                                        isDisabled={isRunning}
                                    >
                                        {_('Cancel')}
                                    </Button>
                                )}
                                {isRunning && (
                                    <Spinner size="md" isSVG style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
                                )}
                            </div>
                        </Form>

                        <Divider style={{ margin: '20px 0' }} />
                        <Title headingLevel="h2" size="lg">
                            {_('Saved Jobs')}
                        </Title>

                        <Grid hasGutter style={{ marginTop: '10px' }}>
                            <GridItem span={12}>
                                <Table variant="compact" className="pf-m-sticky-header" style={{ width: '100%' }}>
                                    <Thead>
                                        <Tr>
                                            <Th>{_('Bucket')}</Th>
                                            <Th>{_('Folder')}</Th>
                                            <Th style={{ textAlign: 'right' }}>{_('Actions')}</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {jobs.map((job, index) => (
                                            <Tr key={index}>
                                                <Td>{job.bucket}</Td>
                                                <Td>{job.folder}</Td>
                                                <Td style={{ textAlign: 'right' }}>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleRunJob(job)}
                                                        style={{ marginRight: '8px' }}
                                                        isDisabled={isRunning}
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
                                                            setEditIndex(index);
                                                        }}
                                                        style={{ marginRight: '8px' }}
                                                        isDisabled={isRunning}
                                                    >
                                                        {_('Edit')}
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleDeleteJob(index)}
                                                        isDisabled={isRunning}
                                                    >
                                                        {_('Delete')}
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </GridItem>
                        </Grid>
                    </CardBody>
                </Card>
            </PageSection>
        </Page>
    );
};