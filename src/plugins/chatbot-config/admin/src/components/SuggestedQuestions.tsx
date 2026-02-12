import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Typography, Flex, TextInput } from '@strapi/design-system';
import { Check, Trash, Pencil, Cross } from '@strapi/icons';

// Custom Styled Button to match Strapi's IconButton style without the Tooltip crash
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral600};
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.neutral150};
    color: ${({ theme }) => theme.colors.neutral800};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const DangerActionButton = styled(ActionButton)`
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.danger100};
    color: ${({ theme }) => theme.colors.danger600};
  }
`;

interface SuggestedQuestionsProps {
  questions: string[];
  onSaveList: (newList: string[]) => void;
}

const SuggestedQuestions = ({ questions, onSaveList }: SuggestedQuestionsProps) => {
  const [currentInput, setCurrentInput] = useState('');

  const handleConfirm = () => {
    if (!currentInput.trim()) return;
    const newList = [currentInput, ...questions];
    onSaveList(newList);
    setCurrentInput('');
  };

  const handleClearDraft = () => {
    setCurrentInput('');
  };

  const handleEdit = (index: number) => {
    const itemToEdit = questions[index];
    const newList = questions.filter((_, i) => i !== index);
    onSaveList(newList);
    setCurrentInput(itemToEdit);
  };

  const handleRemove = (index: number) => {
    const newList = questions.filter((_, i) => i !== index);
    onSaveList(newList);
  };

  return (
    <Box background="neutral0" shadow="filterShadow" hasRadius padding={6} marginBottom={6}>
      <Typography variant="delta" fontWeight="bold" marginBottom={4} display="block">
        Suggested Questions
      </Typography>

      {/* TOP INPUT SECTION */}
      <Flex gap={2} alignItems="flex-end" marginBottom={questions.length > 0 ? 6 : 0}>
        <Box style={{ flexGrow: 1 }}>
          <TextInput
            label="Add a new question"
            placeholder="Type your question here..."
            value={currentInput}
            onChange={(e: any) => setCurrentInput(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleConfirm()}
          />
        </Box>
        <Flex gap={1}>
          <ActionButton onClick={handleConfirm} disabled={!currentInput.trim()} title="Confirm">
            <Check />
          </ActionButton>
          <ActionButton onClick={handleClearDraft} disabled={!currentInput.trim()} title="Clear">
            <Cross />
          </ActionButton>
        </Flex>
      </Flex>

      {/* CONFIRMED QUESTIONS LIST */}
      {questions.length > 0 && (
        <Flex direction="column" alignItems="stretch" gap={2}>
          <Typography variant="sigma" textColor="neutral600" marginBottom={2}>
            Confirmed Questions
          </Typography>
          
          {questions.map((q, index) => (
            <Flex 
              key={index} 
              padding={3} 
              hasRadius 
              background="neutral100" 
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="omega" textColor="neutral800">
                {q}
              </Typography>
              
              <Flex gap={1}>
                <ActionButton onClick={() => handleEdit(index)} title="Edit">
                  <Pencil />
                </ActionButton>
                <DangerActionButton onClick={() => handleRemove(index)} title="Delete">
                  <Trash />
                </DangerActionButton>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default SuggestedQuestions;