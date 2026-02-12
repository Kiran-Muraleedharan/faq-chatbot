import React from 'react';
import { Box, Flex, Typography, Button, Grid, TextInput } from '@strapi/design-system';
import { Key, Plus } from '@strapi/icons';

interface ApiConfigProps {
  openaiKey: string;
  setOpenaiKey: (key: string) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const ApiConfig = ({ openaiKey, setOpenaiKey, isVisible, setIsVisible }: ApiConfigProps) => {
  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
      <Flex justifyContent="space-between" alignItems="center">
        <Typography variant="delta" fontWeight="bold">API Configuration</Typography>
        <Button 
          variant="tertiary" 
          startIcon={openaiKey ? <Key /> : <Plus />} 
          onClick={() => setIsVisible(!isVisible)}
        >
          {openaiKey ? 'Change API Key' : 'Add API Key'}
        </Button>
      </Flex>

      {isVisible && (
        <Box paddingTop={4} style={{ borderTop: '1px solid #f0f0f5', marginTop: '16px' }}>
          <Grid.Root gap={4}>
            <Grid.Item col={6} s={12}>
              <TextInput
                placeholder="sk-..."
                label="OpenAI API Key"
                type="password"
                value={openaiKey}
                onChange={(e: any) => setOpenaiKey(e.target.value)}
              />
            </Grid.Item>
          </Grid.Root>
        </Box>
      )}
    </Box>
  );
};

export default ApiConfig;