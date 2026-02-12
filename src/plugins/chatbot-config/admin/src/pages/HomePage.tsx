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
import ApiConfig from '../components/ApiConfig';
import CollectionSection from '../components/CollectionSection';

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
  const [isApiVisible, setIsApiVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await get('/chatbot-config/config');
        
        const contentTypes = data.contentTypes || [];
        const savedSettings = data.settings?.config || {}; 
        const savedKey = data.settings?.openaiKey || '';

        const formattedItems: CollectionConfig[] = contentTypes.map((ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          isPlugin: ct.uid.includes('plugin::'),
          fields: ct.attributes.map((attr: any) => ({
            name: attr.name,
            enabled: savedSettings[ct.uid]?.includes(attr.name) || false
          }))
        }));

        setItems(formattedItems);
        setOpenaiKey(savedKey);
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
        openaiKey 
      });
      
      toggleNotification({ type: 'success', message: 'Settings saved successfully!' });
      setIsApiVisible(false);
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
        
        {/* API CONFIG SECTION */}
        <ApiConfig 
          openaiKey={openaiKey} 
          setOpenaiKey={setOpenaiKey} 
          isVisible={isApiVisible} 
          setIsVisible={setIsApiVisible} 
        />

        {/* REGULAR COLLECTIONS SECTION */}
        <CollectionSection 
          title="Collections" 
          collections={items.filter(c => !c.isPlugin)} 
          onToggleField={toggleField} 
          onToggleAll={toggleAllFields} 
        />

        {/* GAP */}
        <Box marginTop={6} />

        {/* PLUGIN/FAQ COLLECTIONS SECTION */}
        <CollectionSection 
          title="Chatbot FAQ" 
          collections={items.filter(c => c.isPlugin)} 
          onToggleField={toggleField} 
          onToggleAll={toggleAllFields} 
        />
      </Box>

      {/* FLOATING CHAT PREVIEW */}
      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };