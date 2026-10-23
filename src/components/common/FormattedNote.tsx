import React from 'react';

interface FormattedNoteProps {
  content?: string | null;
  className?: string;
  fallbackText?: string;
}

export const FormattedNote: React.FC<FormattedNoteProps> = ({
  content,
  className = '',
  fallbackText = '',
}) => {
  if (!content || !content.trim()) {
    if (!fallbackText) return null;
    return <span className={className}>{fallbackText}</span>;
  }

  // Quick check if string contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (!hasHtmlTags) {
    return <span className={`whitespace-pre-wrap ${className}`}>{content}</span>;
  }

  // Basic safe sanitization removing script tags and javascript: or on* handlers
  const sanitizedHtml = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  return (
    <span
      className={`inline-block formatted-note-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
