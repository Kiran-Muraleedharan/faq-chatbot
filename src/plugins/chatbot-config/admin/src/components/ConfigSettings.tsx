import React from 'react';
import { Box, Flex, Typography, Button, Divider } from '@strapi/design-system';

interface ConfigSettingsProps {
  openaiKey: string;
  logoUrl: string;
  baseDomain: string;
  contactLink: string;
  onManage: (type: 'key' | 'logo' | 'domain' | 'contact') => void;
}

const ConfigSettings = ({ 
  openaiKey, 
  logoUrl, 
  baseDomain,
  contactLink,
  onManage 
}: ConfigSettingsProps) => {

  const SettingRow = ({ title, isSet, type }: { title: string, isSet: boolean, type: any }) => (
    <Box paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="omega" fontWeight="bold">{title}</Typography>
        <Flex gap={3}>
            {isSet && (
                <Box paddingLeft={2} paddingRight={2} background="success100" hasRadius>
                    <Typography variant="sigma" textColor="success600" fontWeight="bold">CONFIGURED</Typography>
                </Box>
            )}
            <Button variant="tertiary" onClick={() => onManage(type)}>Manage</Button>
        </Flex>
      </Flex>
    </Box>
  );

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={6}>
      <SettingRow type="domain" title="Base Domain" isSet={!!baseDomain} />
      <Divider />
      <SettingRow type="key" title="OpenAI API Key" isSet={!!openaiKey} />
      <Divider />
      <SettingRow type="logo" title="Chatbot Branding Logo" isSet={!!logoUrl} />
      <Divider />
      <SettingRow type="contact" title="Organization Contact Link" isSet={!!contactLink} />
    </Box>
  );
};

export default ConfigSettings;