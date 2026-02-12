import React, { useEffect } from 'react';
import { useStrapiApp } from '@strapi/admin/strapi-admin';

interface MediaLibProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MediaLib = ({ isOpen, onClose, onSelect }: MediaLibProps) => {
  const MediaLibraryDialog = useStrapiApp('ChatbotConfig', (app: any) => {
    const comps = app.components || {};
    
    // DEBUG: Look for the keys in your console to see which one is correct
    if (isOpen) {
      console.log("--- Chatbot Config Debug: Strapi Component Registry ---");
      console.log("All available keys:", Object.keys(comps));
      console.log("Is 'media-library' present?", !!comps['media-library']);
      console.log("Is 'repo-media-library' present?", !!comps['repo-media-library']);
    }

    return comps['media-library'] || comps['repo-media-library'] || comps['upload'];
  }) as any;

  if (!isOpen || !MediaLibraryDialog) {
    return null;
  }

  const handleSelectAssets = (assets: any[]) => {
    if (assets && assets.length > 0) {
      onSelect(assets[0].url);
    }
    onClose();
  };

  return (
    <MediaLibraryDialog
      onClose={onClose}
      onSelectAssets={handleSelectAssets}
    />
  );
};

export default MediaLib;