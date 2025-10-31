import { alpha, Box, Image, UnstyledButton } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import type { ExtraProps } from 'react-markdown';
import { save } from './utils';

type ImageComponentProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> &
  ExtraProps;

export const ImageComponent = ({
  node,
  className,
  src,
  alt,
  ...props
}: ImageComponentProps) => {
  const downloadImage = async () => {
    if (!src) {
      return;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      // Extract filename from URL or use alt text with proper extension
      const urlPath = new URL(src, window.location.origin).pathname;
      const originalFilename = urlPath.split('/').pop() || '';
      const extension = originalFilename.split('.').pop();
      const hasExtension =
        originalFilename.includes('.') &&
        extension != null &&
        extension.length <= 4;

      let filename = '';

      if (hasExtension) {
        filename = originalFilename;
      } else {
        // Determine extension from blob type
        const mimeType = blob.type;
        let extension = 'png'; // default

        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
          extension = 'jpg';
        } else if (mimeType.includes('png')) {
          extension = 'png';
        } else if (mimeType.includes('svg')) {
          extension = 'svg';
        } else if (mimeType.includes('gif')) {
          extension = 'gif';
        } else if (mimeType.includes('webp')) {
          extension = 'webp';
        }

        const baseName = alt || originalFilename || 'image';
        filename = `${baseName.replace(/\.[^/.]+$/, '')}.${extension}`;
      }

      save(filename, blob, blob.type);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (!src) {
    return null;
  }

  return (
    <Box
      pos="relative"
      my="md"
      display="inline-block"
      className="group"
      data-streamdown="image-wrapper"
    >
      <Image
        alt={alt}
        className={className}
        // className={cx(css({ maxW: 'full', rounded: 'lg' }), className)}
        data-streamdown="image"
        src={src}
        {...props}
      />
      {/*<div className="pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block" />*/}
      <Box
        pos="absolute"
        display="none"
        bg={alpha('black', 0.1)}
        style={{
          pointerEvents: 'none',
          boxShadow:
            'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      />
      <UnstyledButton
        // className={cx(
        //   // 'bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background',
        //   // 'opacity-0 group-hover:opacity-100',
        //   css({
        //     pos: 'absolute',
        //     right: 2,
        //     bottom: 2,
        //     display: 'flex',
        //     boxSize: '8',
        //     cursor: 'pointer',
        //     alignItems: 'center',
        //     justifyContent: 'center',
        //     rounded: 'md',
        //     borderWidth: '1px',
        //     borderColor: 'border',
        //     bg: 'bg/90',
        //     shadow: 'low',
        //     backdropBlur: 'sm',
        //     transition: 'all',
        //     transitionDuration: '200ms',
        //     _hover: { bg: 'bg' },
        //     opacity: 0,
        //     _groupHover: { opacity: 100 },
        //   }),
        // )}
        onClick={downloadImage}
        title="Скачать изображение"
        type="button"
      >
        <IconDownload size={14} />
      </UnstyledButton>
    </Box>
  );
};
