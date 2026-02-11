import React, { useEffect, useState } from 'react';
import {
  Main,
  Button,
  Box,
  Typography,
  Checkbox,
  Loader,
  Alert,
  Flex,
  Accordion,
  Grid,
  Link,
  TextInput,
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/admin/strapi-admin';
import { Check, ArrowLeft, Key, Plus } from '@strapi/icons';

const HomePage = () => {
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<Record<string, string[]>>({});
  const [openaiKey, setOpenaiKey] = useState('');
  const [isApiVisible, setIsApiVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<any>(null);
  
  const { get, post } = useFetchClient();

  useEffect(() => {
    get('/chatbot-config/config').then((res) => {
      if (res.data) {
        setContentTypes(res.data.contentTypes || []);
        setSelectedConfig(res.data.settings?.config || {});
        setOpenaiKey(res.data.settings?.openaiKey || '');
      }
      setLoading(false);
    });
  }, [get]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await post('/chatbot-config/config', { 
        config: selectedConfig,
        openaiKey: openaiKey 
      });
      setAlert({ variant: 'success', message: 'Settings saved successfully' });
      setIsApiVisible(false); // Collapse the API box after saving
    } catch (err) {
      setAlert({ variant: 'danger', message: 'Error saving settings' });
    }
    setSaving(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const onToggleField = (uid: string, fieldName: string) => {
    setSelectedConfig((prev) => {
      const currentFields = prev[uid] ? [...prev[uid]] : [];
      const nextFields = currentFields.includes(fieldName)
        ? currentFields.filter((f) => f !== fieldName)
        : [...currentFields, fieldName];

      const nextConfig = { ...prev };
      if (nextFields.length === 0) {
        delete nextConfig[uid];
      } else {
        nextConfig[uid] = nextFields;
      }
      return nextConfig;
    });
  };

  const onToggleCollection = (uid: string, allFields: string[]) => {
    setSelectedConfig((prev) => {
      const currentLength = prev[uid]?.length || 0;
      const isCurrentlyFull = currentLength === allFields.length;
      
      const nextConfig = { ...prev };
      if (isCurrentlyFull) {
        delete nextConfig[uid];
      } else {
        nextConfig[uid] = [...allFields];
      }
      return nextConfig;
    });
  };

  if (loading) return <Flex justifyContent="center" paddingTop={10}><Loader /></Flex>;

  return (
    <Main>
      {/* ALERT */}
      {alert && (
        <Box position="absolute" top={4} left="50%" style={{ transform: 'translateX(-50%)', zIndex: 10 }}>
          <Alert title={alert.message} variant={alert.variant} onClose={() => setAlert(null)} />
        </Box>
      )}

      {/* HEADER */}
      <Box background="neutral100" paddingLeft={8} paddingRight={8} paddingTop={6} paddingBottom={6}>
        <Box paddingBottom={2}>
             <Link startIcon={<ArrowLeft />} to="/admin/plugins/chatbot-config">
                Back
             </Link>
        </Box>

        <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="beta" fontWeight="bold">Chatbot Configuration</Typography>
            <Button onClick={handleSave} loading={saving} startIcon={<Check />}>Save Changes</Button>
        </Flex>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box paddingLeft={8} paddingRight={8} background="neutral100">
        
        {/* API CONFIGURATION BOX */}
        <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
            <Flex justifyContent="space-between" alignItems="center">
                <Typography variant="delta" fontWeight="bold">API Configuration</Typography>
                <Button 
                    variant="tertiary" 
                    startIcon={openaiKey ? <Key /> : <Plus />}
                    onClick={() => setIsApiVisible(!isApiVisible)}
                >
                    {openaiKey ? 'Change API Key' : 'Add API Key'}
                </Button>
            </Flex>

            {isApiVisible && (
                <Box paddingTop={4} style={{ borderTop: '1px solid #f0f0f5', marginTop: '16px' }}>
                    <Grid.Root gap={4}>
                        <Grid.Item col={6} s={12}>
                            <TextInput
                                placeholder="sk-..."
                                label="OpenAI API Key"
                                name="openaiKey"
                                hint="Stored securely in your database."
                                type="password"
                                value={openaiKey}
                                onChange={(e: any) => setOpenaiKey(e.target.value)}
                            />
                        </Grid.Item>
                    </Grid.Root>
                </Box>
            )}
        </Box>
            
        {/* PERMISSIONS SECTION */}
        <Box background="neutral0" shadow="filterShadow" hasRadius padding={0} marginBottom={10}>
            <Box padding={6} paddingBottom={0}>
                <Typography variant="delta" fontWeight="bold">Permissions</Typography>
                <Box paddingTop={1} paddingBottom={4}>
                    <Typography variant="pi" textColor="neutral600">
                        Select the fields you want to expose to the chatbot.
                    </Typography>
                </Box>
            </Box>

            <Accordion.Root type="single" collapsible>
              {contentTypes.map((ct) => {
                const allFieldNames = ct.attributes.map((a: any) => a.name);
                const selectedFields = selectedConfig[ct.uid] || [];
                const isAllSelected = selectedFields.length === allFieldNames.length && allFieldNames.length > 0;
                const isSomeSelected = selectedFields.length > 0 && !isAllSelected;
                const handleSelectAll = () => onToggleCollection(ct.uid, allFieldNames);

                return (
                  <Accordion.Item key={ct.uid} value={ct.uid}>
                    <Accordion.Header>
                        <Accordion.Trigger>
                            <Box paddingLeft={2} textAlign="left">
                                <Typography variant="delta" fontWeight="bold" display="block">{ct.displayName}</Typography>
                                <Typography variant="pi" textColor="neutral600" display="block">
                                    Configure indexing for {ct.displayName}
                                </Typography>
                            </Box>
                        </Accordion.Trigger>
                    </Accordion.Header>
                    
                    <Accordion.Content>
                      <Box background="neutral100" padding={6}>
                        <Flex justifyContent="flex-end" paddingBottom={4} marginBottom={4}>
                            <Box background="neutral0" padding={2} paddingLeft={3} paddingRight={3} hasRadius borderColor="neutral200" borderStyle="solid" borderWidth="1px">
                                <Checkbox checked={isAllSelected} indeterminate={isSomeSelected} onCheckedChange={handleSelectAll}>
                                    <Typography fontWeight="bold">Select all</Typography>
                                </Checkbox>
                            </Box>
                        </Flex>

                        <Grid.Root gap={4}>
                          {ct.attributes.map((attr: any) => {
                            const isChecked = selectedFields.includes(attr.name);
                            return (
                              <Grid.Item col={4} s={6} xs={12} key={attr.name}>
                                <Box padding={3} hasRadius background="neutral0" borderColor={isChecked ? 'primary600' : 'neutral200'} borderStyle="solid" borderWidth="1px" shadow="tableShadow">
                                    <Checkbox checked={isChecked} onCheckedChange={() => onToggleField(ct.uid, attr.name)}>
                                        <Typography variant="omega" fontWeight="semiBold">{attr.name}</Typography>
                                        &nbsp;
                                        <Typography variant="pi" textColor="neutral500">({attr.type})</Typography>
                                    </Checkbox>
                                </Box>
                              </Grid.Item>
                            );
                          })}
                        </Grid.Root>
                      </Box>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
        </Box>
      </Box>
    </Main>
  );
};

export { HomePage };