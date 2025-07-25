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
    Modal,
    Page,
    PageSection,
    Spinner,
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
import { loadConfig, getConfigValue, saveConfig } from './config';
import { encryptData, decryptData } from './encrypt';
import { summarizeBackupOutput } from './utils';

const _ = cockpit.gettext;
const JOBS_FILE = '/etc/backblaze-b2/jobs.json';

type Job = {
    jobName: string;
    keyId: string;
    appKey: string;
    bucket: string;
    folder: string;
};

export const Application = () => {
    const [jobName, setJobName] = useState('');
    const [keyId, setKeyId] = useState('');
    const [appKey, setAppKey] = useState('');
    const [bucket, setBucket] = useState('');
    const [folder, setFolder] = useState('');
    const [output, setOutput] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showAlert, setShowAlert] = useState(true);


    // Config modal
    const [showConfig, setShowConfig] = useState(false);
    const [newSecret, setNewSecret] = useState('');

    // Load config, then secretKey, then jobs
    useEffect(() => {
        const init = async () => {
            await loadConfig();
            const key = getConfigValue('secretKey', 'changeme12345678');

            loadJobs();
        };
        init();
    }, []);


    // Always pass secretKey as param for clarity
    const loadJobs = async () => {
        try {
            const content = await cockpit.file(JOBS_FILE, { superuser: 'require' }).read();
            const parsedJobs: Job[] = JSON.parse(content);

            // Decrypt using current secretKey
            const decryptedJobs: Job[] = parsedJobs.map((job) => ({
                ...job,
                keyId: decryptData(job.keyId, getConfigValue('secretKey', 'changeme12345678')),
                appKey: decryptData(job.appKey, getConfigValue('secretKey', 'changeme12345678'))
            }));
            setJobs(decryptedJobs);
        } catch (err: any) {
            showOutput(_('Error loading jobs: ') + (err.message || err));
            setJobs([]);
        }
    };

    const saveJobs = async (newJobs: Job[]) => {
        try {

            // Encrypt using current secretKey
            const encryptedJobs: Job[] = newJobs.map((job) => ({
                ...job,
                keyId: encryptData(job.keyId, getConfigValue('secretKey', 'changeme12345678')),
                appKey: encryptData(job.appKey, getConfigValue('secretKey', 'changeme12345678'))
            }));

            await cockpit.file(JOBS_FILE, { superuser: 'require' }).replace(JSON.stringify(encryptedJobs, null, 2));
            setJobs(newJobs);
        } catch (err: any) {
            showOutput(_('Error saving job: ') + (err.message || err));
        }
    };

    const handleSaveJob = async () => {
        if (!jobName || !keyId || !appKey || !bucket || !folder) {
            showOutput(_('All fields are required.'));
            return;
        }

        let updatedJobs;
        if (editIndex !== null) {
            updatedJobs = [...jobs];
            updatedJobs[editIndex] = { jobName, keyId, appKey, bucket, folder };
        } else {
            updatedJobs = [...jobs, { jobName, keyId, appKey, bucket, folder }];
        }

        await saveJobs(updatedJobs);

        showOutput(_('Job saved.'));
        setJobName('');
        setKeyId('');
        setAppKey('');
        setBucket('');
        setFolder('');
        setEditIndex(null);
    };

    const showOutput = (msg: string) => {
        setOutput(msg);
        setShowAlert(true);
    };

    const handleCancelEdit = () => {
        setEditIndex(null);
        setJobName('');
        setKeyId('');
        setAppKey('');
        setBucket('');
        setFolder('');
    };

    const handleDeleteJob = async (index: number) => {
        if (!window.confirm(_('Are you sure you want to delete this job?'))) return;

        const updatedJobs = [...jobs];
        updatedJobs.splice(index, 1);
        await saveJobs(updatedJobs);
        showOutput(_('Job deleted.'));
    };

    const handleRunJob = async (job: Job) => {
        if (!window.confirm(_('Are you sure you want to run this backup job?'))) return;


        setIsRunning(true);
        document.body.style.cursor = 'wait';

        try {

            // The job in jobs[] is already DECRYPTED!
            const decryptedKeyId = job.keyId;
            const decryptedAppKey = job.appKey;

            showOutput(_('Running backup : ') + job.jobName);

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
                    showOutput(summarizeBackupOutput(data).summary);
                    setIsRunning(false);
                    document.body.style.cursor = 'default';
                })
                .fail((err: any) => {
                    showOutput(_('Backup failed: ') + (err.message || err));
                    setIsRunning(false);
                    document.body.style.cursor = 'default';
                });

            setIsRunning(false);
            document.body.style.cursor = 'default';
        } catch (err: any) {

            showOutput(_('Error running job: ') + (err.message || err));
            setIsRunning(false);
            document.body.style.cursor = 'default';
        }
    };

    return (
        <Page className="no-masthead-sidebar" isContentFilled>
            <PageSection>
                <Card>
                    <CardTitle>
                        <span>{_('Backblaze B2 Backup')}</span>
                        <Button
                            variant="secondary"
                            style={{ float: 'right', marginLeft: 8 }}
                            onClick={() => {
                                setNewSecret(getConfigValue('secretKey', 'changeme12345678'));   // Set input to current secret
                                setShowConfig(true);
                            }}
                            isDisabled={isRunning || editIndex !== null}
                        >{_('Config')}</Button>
                    </CardTitle>
                    <CardBody>

                        {/* Show output as an Alert if present and visible */}
                        {output && showAlert && (
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
                                timeout={5000}
                                onTimeout={() => setShowAlert(false)}
                                actionClose={<AlertActionCloseButton onClose={() => setShowAlert(false)} />}
                            />
                        )}

                        <Form isHorizontal>
                            <Grid hasGutter>
                                <GridItem span={6}>
                                    <FormGroup label={_('Job Name')} fieldId="jobName">
                                        <TextInput id="jobName" value={jobName} onChange={(_, v) => setJobName(v)} />
                                    </FormGroup>
                                </GridItem>
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
                                    <FormGroup label={_('Folder to Backup')} fieldId="folder">
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
                                    <Spinner size="md" style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
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
                                            <Th>{_('Name')}</Th>
                                            <Th>{_('Bucket')}</Th>
                                            <Th>{_('Folder')}</Th>
                                            <Th style={{ textAlign: 'right' }}>{_('Actions')}</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {jobs.map((job, index) => (
                                            <Tr key={index}>
                                                <Td>{job.jobName}</Td>
                                                <Td>{job.bucket}</Td>
                                                <Td>{job.folder}</Td>
                                                <Td style={{ textAlign: 'right' }}>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => handleRunJob(job)}
                                                        style={{ marginRight: '8px' }}
                                                        isDisabled={isRunning || editIndex !== null}
                                                    >
                                                        {_('Run')}
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setJobName(job.jobName);
                                                            setKeyId(job.keyId);
                                                            setAppKey(job.appKey);
                                                            setBucket(job.bucket);
                                                            setFolder(job.folder);
                                                            setEditIndex(index);
                                                            setShowAlert(false);
                                                        }}
                                                        style={{ marginRight: '8px' }}
                                                        isDisabled={isRunning || editIndex !== null}
                                                    >
                                                        {_('Edit')}
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleDeleteJob(index)}
                                                        isDisabled={isRunning || editIndex !== null}
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

                {showConfig && (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <div style={{
                            background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 18px #0003'
                        }}>
                            <h3>Config</h3>
                            <label style={{ display: 'block', marginBottom: 8 }}>Secret Key</label>
                            <input
                                type="text"
                                value={newSecret}
                                onChange={e => setNewSecret(e.target.value)}
                                style={{ width: '100%', marginBottom: 16, padding: 6 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Button
                                    variant="danger"
                                    onClick={() => setShowConfig(false)}
                                >
                                    Cancel
                                </Button>


                                <Button
                                    variant="primary"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={async () => {
                                        await saveConfig({ secretKey: newSecret });
                                        setShowConfig(false);

                                        showOutput('Secret updated.');
                                        loadJobs();      // reload jobs using new secret
                                    }}
                                >
                                    {_('Save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </PageSection>
        </Page>
    );
};