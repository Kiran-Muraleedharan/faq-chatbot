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
import PopUp from '../components/PopUp'; // Import the new Unified PopUp

// --- TYPES ---
type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  uid: string;
  name: string;
  fields: FieldConfig[];
};

const HomePage = () => {
  // --- Data States ---
  const [allContentTypes, setAllContentTypes] = useState<CollectionConfig[]>([]);
  const [activeCollections, setActiveCollections] = useState<CollectionConfig[]>([]);
  
  // --- Settings States ---
  const [openaiKey, setOpenaiKey] = useState('');
  const [businessPrompt, setBusinessPrompt] = useState('');
  const [responseStyle, setResponseStyle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [baseDomain, setBaseDomain] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<'key' | 'business' | 'style' | 'logo' | 'domain' | 'collections' | null>(null);

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

        // 1. Initialize Settings
        setOpenaiKey(settings.openaiKey || '');
        setBusinessPrompt(settings.businessPrompt || '');
        setResponseStyle(settings.responseStyle || '');
        setLogoUrl(settings.logoUrl || '');
        setBaseDomain(settings.baseDomain || '');
        setSuggestedQuestions(settings.suggestedQuestions || []);

        // 2. Initialize All Possible Collections (Friend's Logic)
        const formattedAll: CollectionConfig[] = contentTypes.map((ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          fields: ct.attributes.map((attr: any) => ({
            name: attr.name,
            enabled: savedConfig[ct.uid]?.includes(attr.name) || false
          }))
        }));

        setAllContentTypes(formattedAll);

        // 3. Set Active Collections (only those present in saved config)
        const initialActive = formattedAll.filter(ct => 
          Object.keys(savedConfig).includes(ct.uid)
        );
        setActiveCollections(initialActive);

      } catch (err) {
        toggleNotification({ type: 'warning', message: 'Error loading configuration.' });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [get]);

  // Handle Collection Selection (Friend's Logic)
  const handleUpdateCollections = (selectedUids: string[]) => {
    setActiveCollections((currentActive) => {
      const remainingActive = currentActive.filter(c => selectedUids.includes(c.uid));
      const currentUids = currentActive.map(c => c.uid);
      const newUids = selectedUids.filter(uid => !currentUids.includes(uid));
      
      const newlyAdded = allContentTypes
        .filter(ct => newUids.includes(ct.uid))
        .map(ct => JSON.parse(JSON.stringify(ct))); // Deep copy to avoid reference issues

      return [...remainingActive, ...newlyAdded];
    });
  };

  // Unified Save for PopUp
  const handlePopupSave = (data: any) => {
    if (activeModal === 'collections') handleUpdateCollections(data);
    else if (activeModal === 'key') setOpenaiKey(data);
    else if (activeModal === 'domain') setBaseDomain(data);
    else if (activeModal === 'logo') setLogoUrl(data);
    else if (activeModal === 'business') setBusinessPrompt(data);
    else if (activeModal === 'style') setResponseStyle(data);
    
    setActiveModal(null);
  };

  // Handle accordion field toggles
  const toggleField = (uid: string, fieldName: string) => {
    setActiveCollections((prev) =>
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

  const toggleAllFields = (uid: string, value: boolean) => {
    setActiveCollections((prev) =>
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
      activeCollections.forEach(item => {
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
            baseDomain={baseDomain}
            onManage={(type) => setActiveModal(type)}
        />

        {/* SUGGESTED QUESTIONS COMPONENT */}
        <SuggestedQuestions 
          questions={suggestedQuestions}
          onSaveList={(newList) => setSuggestedQuestions(newList)}
        />

        {/* PERMISSIONS / COLLECTIONS SECTION (Updated with friend's logic) */}
        <CollectionSection 
          collections={activeCollections} 
          onToggleField={toggleField} 
          onToggleAll={toggleAllFields} 
          onAddClick={() => setActiveModal('collections')}
        />

      </Box>

      {/* UNIFIED POPUP */}
      <PopUp 
        isOpen={!!activeModal} 
        type={activeModal}
        onClose={() => setActiveModal(null)} 
        onSave={handlePopupSave}
        availableCollections={allContentTypes.filter(c => c.uid !== 'plugin::chatbot-config.faq')}
        initialData={
            activeModal === 'collections' ? activeCollections.map(c => c.uid) :
            activeModal === 'key' ? openaiKey :
            activeModal === 'domain' ? baseDomain :
            activeModal === 'logo' ? logoUrl :
            activeModal === 'business' ? businessPrompt : responseStyle
        }
      />

      {/* FLOATING CHAT PREVIEW */}
      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };