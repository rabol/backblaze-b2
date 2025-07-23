import React, { useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardTitle,
    Form,
    FormGroup,
    Page,
    PageSection,
    TextArea,
    TextInput,
    Title
} from '@patternfly/react-core';

import cockpit from 'cockpit';

const _ = cockpit.gettext;

export const Application = () => {
    const [keyId, setKeyId] = useState('');
    const [appKey, setAppKey] = useState('');
    const [bucket, setBucket] = useState('');
    const [folder, setFolder] = useState('/tank_ssd/shared');
    const [output, setOutput] = useState('');

    const runBackup = () => {
        setOutput(_('Running backup...'));

        cockpit
            .spawn(['/usr/libexec/cockpit-backblaze-b2/sync.sh', keyId, appKey, bucket, folder], {
                superuser: 'require'
            })
            .done((data: string) => {
                setOutput(data);
            })
            .fail((err: any) => {
                setOutput(_('Error: ') + (err.message || err));
            });
    };

    return (
        <Page>
            <PageSection variant="light">
                <Card>
                    <CardTitle>{_('Backblaze B2 Backup')}</CardTitle>
                    <CardBody>
                        <Form isHorizontal>
                            <FormGroup label={_('Application Key ID')} fieldId="keyId">
                                <TextInput id="keyId" value={keyId} onChange={(_, v) => setKeyId(v)} />
                            </FormGroup>
                            <FormGroup label={_('Application Key')} fieldId="appKey">
                                <TextInput id="appKey" type="password" value={appKey} onChange={(_, v) => setAppKey(v)} />
                            </FormGroup>
                            <FormGroup label={_('Bucket Name')} fieldId="bucket">
                                <TextInput id="bucket" value={bucket} onChange={(_, v) => setBucket(v)} />
                            </FormGroup>
                            <FormGroup label={_('Local Folder to Backup')} fieldId="folder">
                                <TextInput id="folder" value={folder} onChange={(_, v) => setFolder(v)} />
                            </FormGroup>
                            <Button variant="primary" onClick={runBackup}>
                                {_('Run Backup')}
                            </Button>
                        </Form>

                        <FormGroup label={_('Output')} fieldId="output" style={{ marginTop: '20px' }}>
                            <TextArea id="output" value={output} isReadOnly rows={10} />
                        </FormGroup>
                    </CardBody>
                </Card>
            </PageSection>
        </Page>
    );
};