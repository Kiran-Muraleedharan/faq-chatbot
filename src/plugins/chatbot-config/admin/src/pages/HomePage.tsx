import React, { useEffect, useState } from 'react';
import { Main, Typography, Flex, Button, Box, Loader } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

// Import our custom components
import ChatbotPreview from '../components/ChatbotPreview';
import ConfigSettings from '../components/ConfigSettings'; 
import CollectionSection from '../components/CollectionSection';
import SuggestedQuestions from '../components/SuggestedQuestions';
import InstructionsSection from '../components/InstructionsSection';
import PopUp from '../components/PopUp';

// --- TYPES (Fixed: Defined outside the component to ensure scope) ---
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
  // --- Data States (Fixed: Explicitly typed to avoid 'any') ---
  const [allContentTypes, setAllContentTypes] = useState<CollectionConfig[]>([]);
  const [activeCollections, setActiveCollections] = useState<CollectionConfig[]>([]);
  
  // --- Settings States ---
  const [openaiKey, setOpenaiKey] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [responseInstructions, setResponseInstructions] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [baseDomain, setBaseDomain] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  
  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<'key' | 'logo' | 'domain' | 'contact' | 'collections' | 'suggestion' |  null>(null);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await get('/chatbot-config/config');
        const settings = data.settings || {};
        const savedConfig = settings.config || {}; 

        // 1. Set Settings from Database
        setOpenaiKey(settings.openaiKey || '');
        setSystemInstructions(settings.systemInstructions || '');
        setResponseInstructions(settings.responseInstructions || '');
        setLogoUrl(settings.logoUrl || '');
        setBaseDomain(settings.baseDomain || '');
        setContactLink(settings.contactLink || '');
        setSuggestedQuestions(settings.suggestedQuestions || []);

        // 2. Format All Strapi Content Types
        const formattedAll: CollectionConfig[] = (data.contentTypes || []).map((ct: any) => ({
          uid: ct.uid,
          name: ct.displayName,
          fields: ct.attributes.map((attr: any) => ({
            name: attr.name, 
            enabled: savedConfig[ct.uid]?.includes(attr.name) || false
          }))
        }));

        setAllContentTypes(formattedAll);

        // 3. Set Active Collections (Fixed: ct is now typed via CollectionConfig)
        const initialActive = formattedAll.filter((ct: CollectionConfig) => 
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

  // Handle Logic for Modals
  const handlePopupSave = (data: any) => {
    if (activeModal === 'collections') {
      const selectedUids = data as string[];
      setActiveCollections((currentActive) => {
        const remaining = currentActive.filter(c => selectedUids.includes(c.uid));
        const currentUids = currentActive.map(c => c.uid);
        const newlyAdded = allContentTypes
          .filter(ct => selectedUids.includes(ct.uid) && !currentUids.includes(ct.uid))
          .map(ct => JSON.parse(JSON.stringify(ct))); // Create a deep copy
        return [...remaining, ...newlyAdded];
      });
    } 
    // NEW: Handle Adding/Editing Suggested Questions
    else if (activeModal === 'suggestion') {
      setSuggestedQuestions((prev) => {
        const newList = [...prev];
        if (editingQuestionIndex !== null) {
          // We are updating an existing question
          newList[editingQuestionIndex] = data;
        } else {
          // We are adding a new question to the bottom of the list
          newList.push(data);
        }
        return newList;
      });
      setEditingQuestionIndex(null); // Reset the index after saving
    }
    else if (activeModal === 'key') setOpenaiKey(data);
    else if (activeModal === 'domain') setBaseDomain(data);
    else if (activeModal === 'logo') setLogoUrl(data);
    else if (activeModal === 'contact') setContactLink(data);
    
    setActiveModal(null);
  };

  // Save Settings to Database
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
        systemInstructions, 
        responseInstructions, 
        logoUrl, 
        baseDomain, 
        contactLink, 
        suggestedQuestions
      });
      
      toggleNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch {
      toggleNotification({ type: 'warning', message: 'Error saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Flex justifyContent="center" height="100vh"><Loader /></Flex>;

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
        
        {/* TOP CONFIGURATION ROWS */}
        <ConfigSettings 
            baseDomain={baseDomain} 
            openaiKey={openaiKey} 
            logoUrl={logoUrl} 
            contactLink={contactLink} 
            onManage={(type: any) => setActiveModal(type)}
        />

        {/* ACTIVE COLLECTIONS BOX */}
        <CollectionSection 
          collections={activeCollections} 
          onToggleField={(uid, fName) => {
            setActiveCollections(prev => prev.map(c => c.uid !== uid ? c : {
              ...c, fields: c.fields.map((f: FieldConfig) => f.name === fName ? { ...f, enabled: !f.enabled } : f)
            }));
          }} 
          onToggleAll={(uid, val) => {
            setActiveCollections(prev => prev.map(c => c.uid !== uid ? c : {
              ...c, fields: c.fields.map((f: FieldConfig) => ({ ...f, enabled: val }))
            }));
          }}
          onAddClick={() => setActiveModal('collections')}
        />


        {/* SUGGESTED QUESTIONS */}
<SuggestedQuestions 
  questions={suggestedQuestions}
  onAddClick={() => {
    setEditingQuestionIndex(null);
    setActiveModal('suggestion');
  }}
  onEditClick={(index) => {
    setEditingQuestionIndex(index);
    setActiveModal('suggestion');
  }}
  onRemove={(index) => {
    setSuggestedQuestions(prev => prev.filter((_, i) => i !== index));
  }}
/>



        {/* SYSTEM & RESPONSE INSTRUCTIONS */}
        <InstructionsSection 
          systemInstructions={systemInstructions}
          responseInstructions={responseInstructions}
          onUpdateSystem={setSystemInstructions}
          onUpdateResponse={setResponseInstructions}
        />
      </Box>

      {/* UNIFIED POPUP MODAL */}
      <PopUp 
        isOpen={!!activeModal} 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
        onSave={handlePopupSave}
        // Filter plugin collection so it is not shown in selection popup
        availableCollections={allContentTypes.filter(c => c.uid !== 'plugin::chatbot-config.faq')}
        initialData={
            activeModal === 'collections' ? activeCollections.map(c => c.uid) :
            activeModal === 'suggestion' ? (editingQuestionIndex !== null ? suggestedQuestions[editingQuestionIndex] : ''):
            activeModal === 'key' ? openaiKey :
            activeModal === 'domain' ? baseDomain :
            activeModal === 'logo' ? logoUrl : contactLink
        }
      />

      {/* FLOATING PREVIEW WIDGET */}
      <ChatbotPreview />
    </Main>
  );
};

export { HomePage };