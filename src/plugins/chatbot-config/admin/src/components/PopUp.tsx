import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, Box, Flex, TextInput, Textarea } from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';
import MediaLib from './MediaLib';

interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  type: 'key' | 'business' | 'style' | 'logo' | 'domain' | 'contact' | 'collections'  | 'suggestion' | null;
  initialData: any;
  availableCollections?: any[]; 
}

const PopUp = ({ isOpen, onClose, onSave, type, initialData, availableCollections = [] }: PopUpProps) => {
  const [tempData, setTempData] = useState<any>('');
  const [isMediaLibOpen, setIsMediaLibOpen] = useState(false);

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
      case 'domain':
      case 'contact':
        return (
          <TextInput
            label={type === 'key' ? "API Key" : type === 'domain' ? "Base Domain" : "Contact Link"}
            placeholder="..."
            type={type === 'key' ? "password" : "text"}
            value={tempData}
            onChange={(e: any) => setTempData(e.target.value)}
          />
        );

        case 'suggestion':
            return (
                <TextInput
                label="Question Text"
                placeholder="e.g. How do I track my order?"
                value={tempData}
                onChange={(e: any) => setTempData(e.target.value)}
                />
            );
case 'logo':
  return (
    <Flex direction="column" gap={4} alignItems="stretch">
      <Typography variant="pi" fontWeight="bold" textColor="neutral600">
        Logo Preview
      </Typography>
      <Box 
        padding={tempData ? 4 : 10} 
        hasRadius 
        background="neutral100" 
        borderStyle="dashed" 
        borderWidth="1px" 
        borderColor="neutral300"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}
      >
        {tempData ? (
          <Flex direction="column" gap={4} alignItems="center">
            <img 
                src={tempData} 
                alt="Logo" 
                style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} 
            />
            <Button 
                variant="danger-light" 
                startIcon={<Trash />} 
                onClick={() => setTempData('')}
            >
              Remove Logo
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap={4} alignItems="center">
            {/* Standard Button is more reliable for event handling */}
<Button 
  variant="secondary" 
  startIcon={<Plus />} 
  onClick={() => {
    console.log("Opening Media Library...");
    setIsMediaLibOpen(true);
  }}
>
  Select Logo
</Button>
            <Typography variant="pi" textColor="neutral500">
                Upload or select from Media Library
            </Typography>
          </Flex>
        )}
      </Box>
    </Flex>
  );
      case 'collections':
        return (
          <Flex direction="column" alignItems="stretch" gap={3}>
            {availableCollections.map((col) => {
              const isSelected = tempData.includes(col.uid);
              return (
                <Box
                  key={col.uid} padding={4} hasRadius background={isSelected ? "primary100" : "neutral0"}
                  as="button" type="button" onClick={() => handleToggleCollection(col.uid)}
                  style={{ textAlign: 'left', border: isSelected ? '1px solid #4945ff' : '1px solid #4a4a6a', cursor: 'pointer', width: '100%' }}
                >
                  <Flex direction="column" alignItems="flex-start">
                    <Typography fontWeight="bold" textColor={isSelected ? "primary600" : "neutral800"}>{col.name}</Typography>
                    <Typography variant="pi" textColor="neutral500">{col.uid}</Typography>
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
    contact: "Manage Contact Link",
    collections: "Select Collections",
    suggestion: "Suggested Question"
  };

  return (
    <>
      <Modal.Root open={isOpen} onOpenChange={onClose}>
        <Modal.Content>
          <Modal.Header>
            <Typography fontWeight="bold" textColor="neutral800" as="h2">{titles[type as keyof typeof titles]}</Typography>
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

      {/* 
        IMPORTANT: MediaLib is rendered at the root level of this component 
        to ensure it sits on top of the PopUp modal correctly. 
      */}
      <MediaLib 
        isOpen={isMediaLibOpen} 
        onClose={() => setIsMediaLibOpen(false)} 
        onSelect={(url) => setTempData(url)} 
      />
    </>
  );
};

export default PopUp;