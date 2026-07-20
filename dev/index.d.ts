import type {KatexOptions} from 'katex'

export {mathHtml} from './lib/html.js'
export {math} from './lib/syntax.js'

/**
 * Configuration for HTML output.
 *
 * > 👉 **Note**: passed to `katex.renderToString`.
 * > `displayMode` is overwritten by this plugin, to `false` for inline math
 * > and `true` for display math.
 */
export interface HtmlOptions extends KatexOptions {
  /**
   * The field `displayMode` cannot be passed to `micromark-extension-math`.
   * It is overwritten by it, to `false` for inline math and `true` for
   * display math.
   */
  displayMode?: never
}

/**
 * Configuration.
 */
export interface Options {
  /**
   * Whether to render display-style math delimiters in text as display math
   * (default: `false`).
   *
   * When enabled, `$$...$$` and `\[...\]` used inside text render as display
   * math.
   */
  displayMathInText?: boolean | null | undefined

  /**
   * Whether to support math (text) with a single dollar (default: `true`).
   *
   * Single dollars work in Pandoc and many other places, but often interfere
   * with “normal” dollars in text.
   * If you turn this off, you can use two or more dollars for text math.
   */
  singleDollarTextMath?: boolean | null | undefined
}

/**
 * Augment types.
 */
declare module 'micromark-util-types' {
  /**
   * Compile data.
   */
  interface CompileData {
    mathFlowOpen?: boolean
  }

  /**
   * Token types.
   */
  interface TokenTypeMap {
    mathFlow: 'mathFlow'
    mathFlowFence: 'mathFlowFence'
    mathFlowFenceMeta: 'mathFlowFenceMeta'
    mathFlowFenceSequence: 'mathFlowFenceSequence'
    mathFlowValue: 'mathFlowValue'
    mathText: 'mathText'
    mathTextData: 'mathTextData'
    mathTextDisplay: 'mathTextDisplay'
    mathTextPadding: 'mathTextPadding'
    mathTextSequence: 'mathTextSequence'
  }
}
