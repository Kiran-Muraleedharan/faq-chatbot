import React, { useEffect, useState } from 'react';
import {
  Main,
  Typography,
  Flex,
  Button,
  Box,
  Loader,
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

// Import our custom components
import ChatbotPreview from '../components/ChatbotPreview';
import ConfigSettings from '../components/ConfigSettings'; 
import CollectionSection from '../components/CollectionSection';
import SuggestedQuestions from '../components/SuggestedQuestions';

// --- TYPES ---
type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  uid: string;
  name: string;
  fields: FieldConfig[];
  isPlugin?: boolean;
};

const HomePage = () => {
  const [items, setItems] = useState<CollectionConfig[]>([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [businessPrompt, setBusinessPrompt] = useState('');
  const [responseStyle, setResponseStyle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [baseDomain, setBaseDomain] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  // Updated type to include 'domain'
  const [activeModal, setActiveModal] = useState<'key' | 'business' | 'style' | 'logo' | 'domain' | null>(null);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await get('/chatbot-config/config');

        const contentTypes = data.contentTypes || [];
        const settings = data.settings || {};
        const savedConfig = settings.config || {}; 

        // Set state from database
        setOpenaiKey(settings.openaiKey || '');
        setBusinessPrompt(settings.businessPrompt || '');
        setResponseStyle(settings.responseStyle || '');
        setLogoUrl(settings.logoUrl || '');
        setBaseDomain(settings.baseDomain || '');
        setSuggestedQuestions(settings.suggestedQuestions || []);

        const formattedItems: CollectionConfig[] = contentTypes.map((ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          isPlugin: ct.uid.includes('plugin::'),
          fields: ct.attributes.map((attr: any) => ({
            name: attr.name,
            enabled: savedConfig[ct.uid]?.includes(attr.name) || false
          }))
        }));

        setItems(formattedItems);
      } catch (err) {
        toggleNotification({ type: 'warning', message: 'Error loading configuration.' });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [get]);

  // Handle individual field toggle
  const toggleField = (uid: string, fieldName: string) => {
    setItems((prev) =>
      prev.map((c) => {
        if (c.uid !== uid) return c;
        return {
          ...c,
          fields: c.fields.map((f) =>
            f.name === fieldName ? { ...f, enabled: !f.enabled } : f
          ),
        };
      })
    );
  };

  // Handle "Select All" toggle
  const toggleAllFields = (uid: string, value: boolean) => {
    setItems((prev) =>
      prev.map((c) => {
        if (c.uid !== uid) return c;
        return {
          ...c,
          fields: c.fields.map((f) => ({ ...f, enabled: value })),
        };
      })
    );
  };

  // Logic for opening popups
  const handleManageSetting = (type: 'key' | 'business' | 'style' | 'logo' | 'domain') => {
    setActiveModal(type);
  };

  // Save to server
  const save = async () => {
    setIsSaving(true);
    try {
      const configToSave: Record<string, string[]> = {};
      items.forEach(item => {
        const enabled = item.fields.filter(f => f.enabled).map(f => f.name);
        if (enabled.length > 0) configToSave[item.uid] = enabled;
      });

      await post('/chatbot-config/config', { 
        config: configToSave, 
        openaiKey,
        businessPrompt,
        responseStyle,
        logoUrl,
        baseDomain,
        suggestedQuestions
      });
      
      toggleNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch {
      toggleNotification({ type: 'warning', message: 'Error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Loader>Loading configuration...</Loader>
      </Flex>
    );
  }

  return (
    <Main>
      {/* PAGE HEADER */}
      <Box background="neutral100" padding={8} paddingBottom={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="beta" fontWeight="bold">Chatbot Configuration</Typography>
          <Button onClick={save} loading={isSaving} startIcon={<Check />}>Save Settings</Button>
        </Flex>
      </Box>

      {/* BODY CONTENT */}
      <Box paddingLeft={8} paddingRight={8} background="neutral100">
        
        {/* CONFIGURATION SETTINGS HUB */}
        <ConfigSettings 
            openaiKey={openaiKey}
            businessPrompt={businessPrompt}
            responseStyle={responseStyle}
            logoUrl={logoUrl}
            baseDomain={baseDomain} // Added this prop
            onManage={handleManageSetting}
        />

        {/* SUGGESTED QUESTIONS COMPONENT */}


        {/* PERMISSIONS / COLLECTIONS SECTION */}
        <CollectionSection 
          title="Collections" 
          collections={items} 
          onToggleField={toggleField} 
          onToggleAll={toggleAllFields} 
        />

        <SuggestedQuestions 
          questions={suggestedQuestions}
          onSaveList={(newList) => setSuggestedQuestions(newList)}
        />

      </Box>

      {/* FLOATING CHAT PREVIEW */}
      <ChatbotPreview />

      {/* MODALS PLACEHOLDER */}
      {activeModal && (
          <Box>
              {/* Popups will be added here in the next step */}
          </Box>
      )}
    </Main>
  );
};

export { HomePage };