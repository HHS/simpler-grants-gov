import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

// const textField: Field = [
//   {
//     name: 'richText',
//     type: 'richText',
//     editor: lexicalEditor({
//       features: ({ rootFeatures }) => {
//         return [
//           ...rootFeatures,
//           HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
//           FixedToolbarFeature(),
//           InlineToolbarFeature(),
//         ]
//       },
//     }),
//     label: false,
//   },
// ]

export const Content: Block = {
  slug: 'textContent',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
  ],
}
