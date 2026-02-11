import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import {
  Main,
  Typography,
  Flex,
  Button,
  Box,
  Checkbox,
  Loader,
  Divider,
  Accordion,
  TextInput,
  Grid,
} from '@strapi/design-system';
import { Check, Key, Plus, Message, Cross, PaperPlane } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';

// --- TYPES ---
type FieldConfig = {
  name: string;
  enabled: boolean;
};

type CollectionConfig = {
  uid: string; // Internal Strapi UID
  name: string; // Display Name
  fields: FieldConfig[];
  isPlugin?: boolean;
};

type CheckboxValue = boolean | 'indeterminate';

// --- CHATBOT STYLED COMPONENTS ---
const FloatingWrapper = styled(Box)<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  
  width: ${({ $isOpen }) => ($isOpen ? '380px' : '64px')};
  height: ${({ $isOpen }) => ($isOpen ? '550px' : '64px')};
  border-radius: ${({ $isOpen }) => ($isOpen ? '16px' : '50%')};
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
`;

const ChatbotToggleButton = styled.button`
  width: 64px;
  height: 64px;
  border: none;
  background: ${({ theme }) => theme.colors.primary600};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.primary700};
    &::after {
      content: 'Chatbot Preview';
      position: absolute;
      right: 75px;
      background: ${({ theme }) => theme.colors.neutral800};
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
    }
  }
`;

const HomePage = () => {
  const [items, setItems] = useState<CollectionConfig[]>([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [isApiVisible, setIsApiVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hello! You can test the chatbot preview here.", isUser: false }
  ]);

  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch config from your service
        const { data } = await get('/chatbot-config/config');
        
        const contentTypes = data.contentTypes || [];
        const savedSettings = data.settings?.config || {}; // This is Record<uid, string[]>
        const savedKey = data.settings?.openaiKey || '';

        // MAP STRAPI DATA TO UI FORMAT
        const formattedItems: CollectionConfig[] = contentTypes.map((ct: any) => {
          const enabledFields = savedSettings[ct.uid] || [];
          
          return {
            uid: ct.uid,
            name: ct.displayName,
            isPlugin: ct.uid.includes('plugin::'),
            fields: ct.attributes.map((attr: any) => ({
              name: attr.name,
              enabled: enabledFields.includes(attr.name)
            }))
          };
        });

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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen]);

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

  const save = async () => {
    setIsSaving(true);
    try {
      // Reformat back to the structure the backend expects: Record<uid, string[]>
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { text: chatInput, isUser: true }]);
    setChatInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Preview mode: Chatbot is responding based on your config.", isUser: false }]);
    }, 800);
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Loader>Loading configuration...</Loader>
      </Flex>
    );
  }

  const apiCollections = items.filter((c) => !c.isPlugin);
  const pluginCollections = items.filter((c) => c.isPlugin);

  const renderCollections = (list: CollectionConfig[]) => (
    <Accordion.Root type="multiple">
      {list.map((c) => {
        const allChecked = c.fields.every((f) => f.enabled);
        const someChecked = c.fields.some((f) => f.enabled);

        return (
          <Accordion.Item key={c.uid} value={c.uid}>
            <Accordion.Header>
              <Accordion.Trigger>
                <Box paddingLeft={2} textAlign="left">
                  <Typography variant="delta" fontWeight="bold" display="block">{c.name}</Typography>
                  <Typography variant="pi" textColor="neutral600">
                    Define all allowed fields for {c.name}.
                  </Typography>
                </Box>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content>
              <Box background="neutral100" padding={4}>
                <Flex justifyContent="space-between" alignItems="center" paddingBottom={2}>
                  <Typography variant="sigma" textColor="neutral600">{c.name.toUpperCase()}</Typography>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    onCheckedChange={(value: CheckboxValue) => toggleAllFields(c.uid, value === true)}
                  >
                    Select all
                  </Checkbox>
                </Flex>
                <Divider marginBottom={3} />
                <Box paddingTop={2}>
                  <Flex gap={2} wrap="wrap">
                    {c.fields.map((f) => (
                      <Box key={f.name} paddingRight={2} paddingBottom={1} style={{ minWidth: '140px' }}>
                        <Flex alignItems="center" gap={2}>
                          <Checkbox checked={f.enabled} onCheckedChange={() => toggleField(c.uid, f.name)} />
                          <Typography variant="omega">{f.name}</Typography>
                        </Flex>
                      </Box>
                    ))}
                  </Flex>
                </Box>
              </Box>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );

  return (
    <Main>
      <Box background="neutral100" padding={8} paddingBottom={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="beta" fontWeight="bold">Realtime Configuration</Typography>
          <Button onClick={save} loading={isSaving} startIcon={<Check />}>Save Settings</Button>
        </Flex>
      </Box>

      <Box paddingLeft={8} paddingRight={8} background="neutral100">
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
                    type="password"
                    value={openaiKey}
                    onChange={(e: any) => setOpenaiKey(e.target.value)}
                  />
                </Grid.Item>
              </Grid.Root>
            </Box>
          )}
        </Box>

        <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={4}>
          <Box padding={6} paddingBottom={2}>
            <Typography variant="delta" fontWeight="bold">Collections</Typography>
          </Box>
          {renderCollections(apiCollections)}
        </Box>

        <Box marginTop={6} />

        {pluginCollections.length > 0 && (
          <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={4}>
            <Box padding={6} paddingBottom={2}>
              <Typography variant="delta" fontWeight="bold">Chatbot FAQ</Typography>
            </Box>
            {renderCollections(pluginCollections)}
          </Box>
        )}
      </Box>

      {/* CHATBOT PREVIEW */}
      <FloatingWrapper $isOpen={isChatOpen} background="neutral0">
        {!isChatOpen ? (
          <ChatbotToggleButton onClick={() => setIsChatOpen(true)}>
            <Message width={28} height={28} />
          </ChatbotToggleButton>
        ) : (
          <Flex direction="column" alignItems="stretch" style={{ height: '100%' }}>
            <Box padding={4} background="primary600">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex gap={2}>
                    <Message color="neutral0" width={18} />
                    <Typography fontWeight="bold" textColor="neutral0">Chatbot Preview</Typography>
                </Flex>
                <Box as="button" onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Cross color="neutral0" width={14} />
                </Box>
              </Flex>
            </Box>

            <Box ref={scrollRef} padding={4} background="neutral100" style={{ flex: 1, overflowY: 'auto' }}>
                <Flex direction="column" alignItems="stretch" gap={3}>
                    {messages.map((msg, idx) => (
                        <Box key={idx} padding={3} hasRadius background={msg.isUser ? "primary600" : "neutral0"} shadow="filterShadow" style={{ alignSelf: msg.isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <Typography textColor={msg.isUser ? "neutral0" : "neutral800"}>{msg.text}</Typography>
                        </Box>
                    ))}
                </Flex>
            </Box>

            <Box padding={3} background="neutral0" style={{ borderTop: '1px solid #f0f0f5' }}>
                <Flex gap={2}>
                    <TextInput placeholder="Type a message..." value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleSendMessage()} />
                    <Button onClick={handleSendMessage} startIcon={<PaperPlane />}>Send</Button>
                </Flex>
            </Box>
          </Flex>
        )}
      </FloatingWrapper>
    </Main>
  );
};

export { HomePage };