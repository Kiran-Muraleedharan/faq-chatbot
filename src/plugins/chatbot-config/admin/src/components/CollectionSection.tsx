import React from 'react';
import { Box, Typography, Flex, Checkbox, Divider, Accordion } from '@strapi/design-system';

interface FieldConfig {
  name: string;
  enabled: boolean;
}

interface CollectionConfig {
  uid: string;
  name: string;
  fields: FieldConfig[];
}

interface CollectionSectionProps {
  title: string;
  collections: CollectionConfig[];
  onToggleField: (uid: string, fieldName: string) => void;
  onToggleAll: (uid: string, value: boolean) => void;
}

const CollectionSection = ({ title, collections, onToggleField, onToggleAll }: CollectionSectionProps) => {
  if (collections.length === 0) return null;

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius paddingBottom={4} marginBottom={6}>
      <Box padding={6} paddingBottom={2}>
        <Typography variant="delta" fontWeight="bold">{title}</Typography>
      </Box>

      <Accordion.Root type="multiple">
        {collections.map((c) => {
          const allChecked = c.fields.every((f) => f.enabled);
          const someChecked = c.fields.some((f) => f.enabled);

          return (
            <Accordion.Item key={c.uid} value={c.uid}>
              <Accordion.Header>
                <Accordion.Trigger>
                  <Box paddingLeft={2} textAlign="left">
                    <Typography variant="delta" fontWeight="bold" display="block">{c.name}</Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Define allowed fields for {c.name}.
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
                      onCheckedChange={(value: any) => onToggleAll(c.uid, value === true)}
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
                            <Checkbox checked={f.enabled} onCheckedChange={() => onToggleField(c.uid, f.name)} />
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
    </Box>
  );
};

export default CollectionSection;