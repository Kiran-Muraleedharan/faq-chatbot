import React from 'react';
import { Box, Flex, Typography, Button, Divider } from '@strapi/design-system';

interface ConfigSettingsProps {
  openaiKey: string;
  businessPrompt: string;
  responseStyle: string;
  logoUrl: string;
  baseDomain: string;
  onManage: (type: 'key' | 'business' | 'style' | 'logo' | 'domain') => void;
}

const ConfigSettings = ({ 
  openaiKey, 
  businessPrompt, 
  responseStyle, 
  logoUrl, 
  baseDomain,
  onManage 
}: ConfigSettingsProps) => {

  const SettingRow = ({ 
    title, 
    isSet, 
    type 
  }: { 
    title: string, 
    isSet: boolean, 
    type: 'key' | 'business' | 'style' | 'logo' | 'domain' 
  }) => (
    <Box paddingLeft={6} paddingRight={6} paddingTop={4} paddingBottom={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="omega" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        
        <Flex gap={3}>
            {isSet && (
                <Box paddingLeft={2} paddingRight={2} background="success100" hasRadius>
                    <Typography variant="sigma" textColor="success600" fontWeight="bold">CONFIGURED</Typography>
                </Box>
            )}
            <Button 
                variant="tertiary" 
                onClick={() => onManage(type)}
            >
                Manage
            </Button>
        </Flex>
      </Flex>
    </Box>
  );

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius marginBottom={6}>
      <SettingRow 
        type="key"
        title="OpenAI API Key"
        isSet={!!openaiKey}
      />
      <Divider />
      <SettingRow 
        type="domain"
        title="Base Domain"
        isSet={!!baseDomain}
      />
      <Divider />
      <SettingRow 
        type="business"
        title="Business Logic Prompt"
        isSet={!!businessPrompt}
      />
      <Divider />
      <SettingRow 
        type="style"
        title="Response Style Prompt"
        isSet={!!responseStyle}
      />
      <Divider />
      <SettingRow 
        type="logo"
        title="Chatbot Branding Logo"
        isSet={!!logoUrl}
      />
    </Box>
  );
};

export default ConfigSettings;