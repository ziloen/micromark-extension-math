/**
 * @import {Options} from '@ziloen/micromark-extension-math'
 * @import {Construct, Previous, Resolver, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

// To do: next major: clean spaces in HTML compiler.
// This has to be coordinated together with `mdast-util-math`.

import {ok as assert} from 'devlop'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {codes, types} from 'micromark-util-symbol'

/**
 * @param {Options | null | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {Construct}
 *   Construct.
 */
export function mathText(options) {
  const options_ = options || {}
  let single = options_.singleDollarTextMath

  if (single === null || single === undefined) {
    single = true
  }

  return {
    tokenize: tokenizeMathText,
    resolve: resolveMathText,
    previous: previousCode,
    name: 'mathText'
  }

  /**
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeMathText(effects, ok, nok) {
    const self = this
    /** @type {number} */
    let codeOpen = codes.dollarSign
    /** @type {number} */
    let codeClose = codes.dollarSign
    /** @type {'mathText' | 'mathTextDisplay'} */
    let type = 'mathText'
    let sizeOpen = 0
    /** @type {number} */
    let size
    /** @type {Token} */
    let tokenType
    /** @type {Token} */
    let token
    let dataSeen = false

    return start

    /**
     * Start of math (text).
     *
     * ```markdown
     * > | $a$
     *     ^
     * > | \$a$
     *      ^
     * ```
     *
     * @type {State}
     */
    function start(code) {
      assert(
        code === codes.dollarSign || code === codes.backslash,
        'expected `$` or `\\`'
      )
      assert(
        code === codes.backslash || previousCode.call(self, self.previous),
        'expected correct previous'
      )

      if (code === codes.backslash) {
        codeOpen = codes.leftParenthesis
        codeClose = codes.rightParenthesis
      }

      tokenType = effects.enter(type)
      effects.enter('mathTextSequence')
      effects.consume(code)
      sizeOpen++
      return code === codes.backslash ? sequenceOpenBackslash : sequenceOpen
    }

    /**
     * In opening sequence.
     *
     * ```markdown
     * > | $a$
     *     ^
     * ```
     *
     * @type {State}
     */

    function sequenceOpen(code) {
      if (code === codes.dollarSign) {
        effects.consume(code)
        sizeOpen++
        return sequenceOpen
      }

      // Not enough markers in the sequence.
      if (
        (sizeOpen < 2 && !single) ||
        (sizeOpen === 1 && !validSingleDollarOpen(self.previous))
      ) {
        return nok(code)
      }

      effects.exit('mathTextSequence')
      return between(code)
    }

    /**
     * After the backslash in an opening sequence.
     *
     * ```markdown
     * > | \(a\)
     *      ^
     * > | \[a\]
     *      ^
     * ```
     *
     * @type {State}
     */
    function sequenceOpenBackslash(code) {
      if (code !== codes.leftParenthesis && code !== codes.leftSquareBracket) {
        return nok(code)
      }

      codeOpen = code
      codeClose =
        code === codes.leftParenthesis
          ? codes.rightParenthesis
          : codes.rightSquareBracket
      type = code === codes.leftParenthesis ? 'mathText' : 'mathTextDisplay'

      tokenType.type = type
      effects.consume(code)
      effects.exit('mathTextSequence')
      return between
    }

    /**
     * Between something and something else.
     *
     * ```markdown
     * > | $a$
     *      ^^
     * ```
     *
     * @type {State}
     */
    function between(code) {
      if (code === codes.eof) {
        return nok(code)
      }

      if (code === codes.dollarSign && codeOpen === codes.dollarSign) {
        token = effects.enter('mathTextSequence')
        size = 0
        return sequenceClose(code)
      }

      if (code === codes.backslash && codeOpen !== codes.dollarSign) {
        token = effects.enter('mathTextSequence')
        return sequenceCloseBackslash(code)
      }

      // Tabs don’t work, and virtual spaces don’t make sense.
      if (code === codes.space) {
        effects.enter('space')
        effects.consume(code)
        effects.exit('space')
        return between
      }

      if (markdownLineEnding(code)) {
        effects.enter(types.lineEnding)
        effects.consume(code)
        effects.exit(types.lineEnding)
        return between
      }

      // Data.
      effects.enter('mathTextData')
      return data(code)
    }

    /**
     * In data.
     *
     * ```markdown
     * > | $a$
     *      ^
     * ```
     *
     * @type {State}
     */
    function data(code) {
      if (
        code === codes.eof ||
        code === codes.space ||
        (code === codes.dollarSign && codeOpen === codes.dollarSign) ||
        (code === codes.backslash && codeOpen !== codes.dollarSign) ||
        markdownLineEnding(code)
      ) {
        effects.exit('mathTextData')
        return between(code)
      }

      effects.consume(code)
      dataSeen = true
      return data
    }

    /**
     * In closing sequence.
     *
     * ```markdown
     * > | `a`
     *       ^
     * ```
     *
     * @type {State}
     */

    function sequenceClose(code) {
      // More.
      if (code === codes.dollarSign) {
        effects.consume(code)
        size++
        return sequenceClose
      }

      // Done!
      if (
        size === sizeOpen &&
        (sizeOpen !== 1 || validSingleDollarClose(code))
      ) {
        effects.exit('mathTextSequence')
        effects.exit(type)
        return ok(code)
      }

      // More or less accents: mark as data.
      token.type = 'mathTextData'
      return data(code)
    }

    /**
     * In a closing backslash sequence.
     *
     * ```markdown
     * > | \(a\)
     *        ^
     * ```
     *
     * @type {State}
     */
    function sequenceCloseBackslash(code) {
      assert(code === codes.backslash, 'expected `\\`')
      effects.consume(code)
      return sequenceCloseBackslashEnd
    }

    /**
     * After the backslash in a closing sequence.
     *
     * @type {State}
     */
    function sequenceCloseBackslashEnd(code) {
      if (code === codeClose) {
        if (!dataSeen) {
          return nok(code)
        }

        effects.consume(code)
        effects.exit('mathTextSequence')
        effects.exit(type)
        return ok
      }

      token.type = 'mathTextData'
      return data(code)
    }
  }
}

/** @type {Resolver} */
function resolveMathText(events) {
  let tailExitIndex = events.length - 4
  let headEnterIndex = 3
  /** @type {number} */
  let index
  /** @type {number | undefined} */
  let enter

  // If we start and end with an EOL or a space.
  if (
    (events[headEnterIndex][1].type === types.lineEnding ||
      events[headEnterIndex][1].type === 'space') &&
    (events[tailExitIndex][1].type === types.lineEnding ||
      events[tailExitIndex][1].type === 'space')
  ) {
    index = headEnterIndex

    // And we have data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === 'mathTextData') {
        // Then we have padding.
        events[tailExitIndex][1].type = 'mathTextPadding'
        events[headEnterIndex][1].type = 'mathTextPadding'
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  // Merge adjacent spaces and data.
  index = headEnterIndex - 1
  tailExitIndex++

  while (++index <= tailExitIndex) {
    if (enter === undefined) {
      if (
        index !== tailExitIndex &&
        events[index][1].type !== types.lineEnding
      ) {
        enter = index
      }
    } else if (
      index === tailExitIndex ||
      events[index][1].type === types.lineEnding
    ) {
      events[enter][1].type = 'mathTextData'

      if (index !== enter + 2) {
        events[enter][1].end = events[index - 1][1].end
        events.splice(enter + 2, index - enter - 2)
        tailExitIndex -= index - enter - 2
        index = enter + 2
      }

      enter = undefined
    }
  }

  return events
}

/**
 * @this {TokenizeContext}
 * @type {Previous}
 */
function previousCode(code) {
  // If there is a previous code, there will always be a tail.
  return (
    code !== codes.dollarSign ||
    this.events[this.events.length - 1][1].type === types.characterEscape
  )
}

/**
 * Check if a character code is a "word" character (alphanumeric or underscore).
 * Matches VS Code's `isWordCharacterOrNumber` (`[\w\d]`).
 *
 * @param {number | null | undefined} code
 *   Character code.
 * @returns {boolean}
 *   Whether the code is a word character.
 */
function isWordCharacter(code) {
  if (code === null || code === undefined) return false
  // A-z (97-122), A-Z (65-90), 0-9 (48-57), _ (95)
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    code === 95
  )
}

/**
 * Check if a single dollar can open, based on the character before it.
 * Aligns with VS Code markdown-it-katex `isValidInlineDelim.can_open`.
 *
 * An opening `$` is valid when preceded by:
 * - start of input (undefined)
 * - whitespace
 * - line ending
 * - non-word character (punctuation, etc.)
 *
 * It is invalid when preceded by a word character (letter, digit, underscore),
 * which prevents matching `a$b$c` in the middle of words.
 *
 * @param {number | null | undefined} before
 *   Code before the opening dollar.
 * @returns {boolean}
 *   Whether a single dollar can open.
 */
function validSingleDollarOpen(before) {
  // Start of input, EOF, whitespace, or line ending → valid
  if (before === undefined || before === null || before === codes.eof)
    return true
  if (markdownSpace(before) || markdownLineEnding(before)) return true
  // Valid if not a word character (allows punctuation, symbols, etc.)
  return !isWordCharacter(before)
}

/**
 * Check if a single dollar can close, based on the character after it.
 * Aligns with VS Code markdown-it-katex `isValidInlineDelim.can_close`.
 *
 * A closing `$` is valid when followed by:
 * - end of input (null / EOF)
 * - whitespace
 * - line ending
 * - non-word character (punctuation, etc.)
 *
 * It is invalid when followed by a word character (letter, digit, underscore),
 * which prevents `$x$20` from matching (digit after closing `$`).
 *
 * @param {number | null} after
 *   Code after the closing dollar.
 * @returns {boolean}
 *   Whether a single dollar can close.
 */
function validSingleDollarClose(after) {
  // End of input, EOF, whitespace, or line ending → valid
  if (after === null || after === codes.eof) return true
  if (markdownSpace(after) || markdownLineEnding(after)) return true
  // Valid if not a word character (allows punctuation, symbols, etc.)
  return !isWordCharacter(after)
}
