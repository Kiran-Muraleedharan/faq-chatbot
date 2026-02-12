import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Button,
  Box,
  Flex,
  TextInput,
  Textarea,
} from '@strapi/design-system';

interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: 'key' | 'business' | 'style' | 'logo' | 'domain' | 'collections' | null;
  initialData: any;
  availableCollections?: any[]; 
}

const PopUp = ({ isOpen, onClose, onSave, type, initialData, availableCollections = [] }: PopUpProps) => {
  const [tempData, setTempData] = useState<any>('');

  useEffect(() => {
    if (isOpen) setTempData(initialData);
  }, [isOpen, initialData]);

  if (!isOpen || !type) return null;

  const handleToggleCollection = (uid: string) => {
    setTempData((prev: string[]) => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const getModalContent = () => {
    switch (type) {
      case 'key':
        return (
          <TextInput
            label="OpenAI API Key"
            placeholder="sk-..."
            type="password"
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );
      case 'domain':
        return (
          <TextInput
            label="Base Domain URL"
            placeholder="https://yourdomain.com"
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );
      case 'logo':
        return (
          <TextInput
            label="Branding Logo URL"
            placeholder="https://path-to-your-logo.png"
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );
      case 'business':
      case 'style':
        return (
          <Textarea
            label={type === 'business' ? "Business Logic Prompt" : "Response Style Prompt"}
            placeholder="Enter instructions for the chatbot..."
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
            style={{ minHeight: '200px' }}
          />
        );
      case 'collections':
        return (
          <Flex direction="column" alignItems="stretch" gap={3}>
            {availableCollections.map((col) => {
              const isSelected = tempData.includes(col.uid);
              return (
                <Box
                  key={col.uid}
                  padding={4}
                  hasRadius
                  background={isSelected ? "primary100" : "neutral0"}
                  as="button"
                  type="button"
                  onClick={() => handleToggleCollection(col.uid)}
                  style={{ 
                    textAlign: 'left', 
                    // Adjusted border color for better visibility in dark mode
                    border: isSelected ? '1px solid #4945ff' : '1px solid #4a4a6a', 
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <Flex direction="column" alignItems="flex-start">
                    {/* Explicitly set textColor to ensure visibility in dark mode */}
                    <Typography 
                        fontWeight="bold" 
                        textColor={isSelected ? "primary600" : "neutral800"}
                    >
                      {col.name}
                    </Typography>
                    <Typography variant="pi" textColor="neutral500">
                      {col.uid}
                    </Typography>
                  </Flex>
                </Box>
              );
            })}
          </Flex>
        );
      default:
        return null;
    }
  };

  const titles = {
    key: "Manage API Key",
    domain: "Manage Base Domain",
    logo: "Manage Branding Logo",
    business: "Business Logic Configuration",
    style: "Response Style Configuration",
    collections: "Select Collections"
  };

  return (
    <Modal.Root open={isOpen} onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          {/* Ensure header text color is theme-aware */}
          <Typography fontWeight="bold" textColor="neutral800" as="h2">
            {titles[type]}
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Box paddingTop={2} paddingBottom={2}>
            {getModalContent()}
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary">Cancel</Button>
          <Button onClick={() => { onSave(tempData); onClose(); }}>Save Changes</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default PopUp;