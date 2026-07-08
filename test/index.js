import assert from 'node:assert/strict'
import test from 'node:test'
import katex from 'katex'
import {micromark} from 'micromark'
import {math, mathHtml} from '@ziloen/micromark-extension-math'

const renderToString = katex.renderToString

test('math', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('@ziloen/micromark-extension-math')).sort(),
      ['math', 'mathHtml']
    )
  })

  await t.test(
    'should skip `mathFlow` and `mathText` construct if `disable.null` includes `mathFlow` and `mathText`',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$, \\(c\\), \\[d\\]\n\n$$\ne\n$$\n\n\\[\nf\n\\]', {
          extensions: [math(), {disable: {null: ['mathFlow', 'mathText']}}],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$a$, $$b$$, (c), [d]</p>\n<p>$$\ne\n$$</p>\n<p>[\nf\n]</p>'
      )
    }
  )

  await t.test(
    'should support one, two, or more dollars by default',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$, $$$c$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString('a') +
          '</span>, <span class="math math-inline">' +
          renderToString('b') +
          '</span>, <span class="math math-inline">' +
          renderToString('c') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support two or more dollars w/ `singleDollarTextMath: false`, but not one',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$, $$$c$$$', {
          extensions: [math({singleDollarTextMath: false})],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$a$, <span class="math math-inline">' +
          renderToString('b') +
          '</span>, <span class="math math-inline">' +
          renderToString('c') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support an escaped dollar sign which would otherwise open math',
    async function () {
      assert.equal(
        micromark('a \\$b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $b$</p>'
      )
    }
  )

  await t.test(
    'should not support escaped dollar signs in math (text)',
    async function () {
      assert.throws(function () {
        micromark('a $b\\$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Unexpected character: '\\' at position 2/)
    }
  )

  await t.test(
    'should support math (text) right after an escaped dollar sign',
    async function () {
      assert.equal(
        micromark('a \\$$b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $<span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support a single dollar in math (text) w/ padding and two dollar signs',
    async function () {
      assert.throws(function () {
        micromark('a $$ $ $$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Can't use function '\$' in math mode at position 1/)
    }
  )

  await t.test(
    'should support nested math by using more dollars outside of math (text)',
    async function () {
      assert.equal(
        micromark('a $$\\raisebox{0.25em}{$\\frac a b$}$$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('\\raisebox{0.25em}{$\\frac a b$}') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support an “escaped” dollar right on the KaTeX level, not on the Markdown level',
    async function () {
      assert.equal(
        micromark('a $$ \\$ $$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('\\$') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support padding with a line ending in math (text)',
    async function () {
      assert.equal(
        micromark('a $$\na\\$ $$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('a\\$') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ one dollar sign',
    async function () {
      assert.equal(
        micromark('a $b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ backslash parentheses',
    async function () {
      assert.equal(
        micromark('a \\(b\\)', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support TeX commands in backslash parenthesized math (text)',
    async function () {
      assert.equal(
        micromark('a \\(\\sqrt{3x-1}\\) b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('\\sqrt{3x-1}') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support EOLs in backslash parenthesized math',
    async function () {
      assert.equal(
        micromark('a \\(b\nc\\) d', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b\nc') +
          '</span> d</p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ two dollar signs',
    async function () {
      assert.equal(
        micromark('a $$b$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ three dollar signs',
    async function () {
      assert.equal(
        micromark('a $$$b$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test('should support EOLs in math', async function () {
    assert.equal(
      micromark('a $b\nc\rd\r\ne$ f', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('b\nc\rd\r\ne') +
        '</span> f</p>'
    )
  })

  await t.test(
    'should support single dollar math when opening is followed by a space (VS Code alignment)',
    async function () {
      assert.equal(
        micromark('$ x$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString(' x') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support single dollar math when closing is preceded by a space (VS Code alignment)',
    async function () {
      assert.equal(
        micromark('$x $', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString('x ') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should not support single dollar math when closing is followed by a digit',
    async function () {
      assert.equal(
        micromark('$x$20', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$x$20</p>'
      )
    }
  )

  await t.test(
    'should not support currency as single dollar math',
    async function () {
      assert.equal(
        micromark('$20,000 and $30,000', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$20,000 and $30,000</p>'
      )
    }
  )

  await t.test(
    'should support math w/ single dollar sign and newlines (VS Code alignment)',
    async function () {
      assert.equal(
        micromark('$\na\n$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString('a') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ two dollar sign',
    async function () {
      assert.equal(
        micromark('$$\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ backslash square brackets',
    async function () {
      assert.equal(
        micromark('\\[a\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support multiline math (flow) w/ backslash square brackets',
    async function () {
      assert.equal(
        micromark('\\[\na\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (text display) w/ backslash square brackets',
    async function () {
      assert.equal(
        micromark('a \\[b\\] c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <div class="math math-display">' +
          renderToString('b', {displayMode: true}) +
          '</div> c</p>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ three dollar sign',
    async function () {
      assert.equal(
        micromark('$$$\na\n$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test('should support math (flow) w/o content', async function () {
    assert.equal(
      micromark('$$\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test(
    'should support math (flow) w/o closing fence',
    async function () {
      assert.equal(
        micromark('$$\na', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/o closing fence ending at an EOL',
    async function () {
      assert.equal(
        micromark('$$\na\n', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ a meta string',
    async function () {
      assert.equal(
        micromark('$$asd &amp; \\& asd\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should not support math (flow) w/ a dollar sign in the meta string',
    async function () {
      assert.equal(
        micromark('$$asd$asd\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$$asd$asd\na</p>\n<div class="math math-display">' +
          renderToString('', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should not support math (flow) w/ content on the closing fence',
    async function () {
      assert.throws(function () {
        micromark('$$\na\n$$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Can't use function '\$' in math mode at position 3/)
    }
  )

  await t.test(
    'should support whitespace on the closing fence',
    async function () {
      assert.equal(
        micromark('$$\na\n$$  ', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should strip the prefix of the opening fence from content lines',
    async function () {
      assert.equal(
        micromark('  $$\n\ta\n  b\n c\nd\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('  a\nb\nc\nd', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should strip arbitrary length prefix from closing fence line (codeIndented disabled)',
    async function () {
      assert.equal(
        micromark('      $$\n      a\n          $$', {
          extensions: [math(), {disable: {null: ['codeIndented']}}],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) in a block quote',
    async function () {
      assert.equal(
        micromark('> $$\n> a\n> $$\n> b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<blockquote>\n' +
          '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n' +
          '<p>b</p>\n' +
          '</blockquote>'
      )
    }
  )

  await t.test(
    'should support math (flow) in a list (item)',
    async function () {
      assert.equal(
        micromark('* $$\n  a\n  $$\n  b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<ul>\n' +
          '<li>\n' +
          '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n' +
          'b' +
          '</li>\n' +
          '</ul>'
      )
    }
  )

  await t.test('should support `<`', async function () {
    assert.equal(
      micromark('a $\\sum_{\\substack{0<i<m\\\\0<j<n}}$ b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('\\sum_{\\substack{0<i<m\\\\0<j<n}}') +
        '</span> b</p>'
    )
  })

  await t.test('should support `"`', async function () {
    assert.equal(
      micromark('a $\\text{a \\"{a} c}$ b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('\\text{a \\"{a} c}') +
        '</span> b</p>'
    )
  })

  await t.test('should support options', async function () {
    assert.equal(
      micromark('a $$ $ $$', {
        extensions: [math()],
        htmlExtensions: [mathHtml({throwOnError: false})]
      }),
      '<p>a <span class="math math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Can&#x27;t use function &#x27;$&#x27; in math mode at position 1: $̲" style="color:#cc0000">$</span></span></p>'
    )
  })

  await t.test('should not support laziness (1)', async function () {
    assert.equal(
      micromark('> $$\na\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>\n</blockquote>\n<p>a</p>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test('should not support laziness (2)', async function () {
    assert.equal(
      micromark('> $$\n> a\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<blockquote>\n<div class="math math-display">' +
        renderToString('a', {displayMode: true}) +
        '</div>\n</blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test('should not support laziness (3)', async function () {
    assert.equal(
      micromark('a\n> $$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a</p>\n<blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>\n</blockquote>'
    )
  })

  await t.test(
    'should not support mixed delimiters: $ with \\]',
    async function () {
      assert.equal(
        micromark('a $b\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $b]</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: $ with \\)',
    async function () {
      assert.equal(
        micromark('a $b\\)', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $b)</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: \\( with $',
    async function () {
      assert.equal(
        micromark('a \\(b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a (b$</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: \\( with \\]',
    async function () {
      assert.equal(
        micromark('a \\(b\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a (b]</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: \\[ with $',
    async function () {
      assert.equal(
        micromark('a \\[b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a [b$</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: \\[ with \\)',
    async function () {
      assert.equal(
        micromark('a \\[b\\)', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a [b)</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: $$ with \\]',
    async function () {
      assert.equal(
        micromark('a $$b\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $$b]</p>'
      )
    }
  )

  await t.test(
    'should not support mixed delimiters: unequal dollar count',
    async function () {
      assert.equal(
        micromark('a $$$b$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $$$b$$</p>'
      )
    }
  )

  await t.test('should not support opening-only $', async function () {
    assert.equal(
      micromark('a $b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a $b</p>'
    )
  })

  await t.test('should not support opening-only \\(', async function () {
    assert.equal(
      micromark('a \\(b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a (b</p>'
    )
  })

  await t.test('should not support opening-only \\[', async function () {
    assert.equal(
      micromark('a \\[b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a [b</p>'
    )
  })

  await t.test('should not support opening-only $$', async function () {
    assert.equal(
      micromark('a $$b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a $$b</p>'
    )
  })

  await t.test('should not support closing-only $', async function () {
    assert.equal(
      micromark('a$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a$</p>'
    )
  })

  await t.test('should not support closing-only $$', async function () {
    assert.equal(
      micromark('a$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a$$</p>'
    )
  })

  await t.test('should not support closing-only \\)', async function () {
    assert.equal(
      micromark('a\\)', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a)</p>'
    )
  })

  await t.test('should not support closing-only \\]', async function () {
    assert.equal(
      micromark('a\\]', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a]</p>'
    )
  })

  await t.test('should not support empty \\[\\] as math', async function () {
    assert.equal(
      micromark('\\[\\]', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>[]</p>'
    )
  })

  await t.test(
    'should not support empty \\[\\] as inline math',
    async function () {
      assert.equal(
        micromark('a \\[\\] b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a [] b</p>'
      )
    }
  )

  await t.test('should not support empty \\(\\) as math', async function () {
    assert.equal(
      micromark('\\(\\)', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>()</p>'
    )
  })

  await t.test(
    'should not support empty \\(\\) as inline math',
    async function () {
      assert.equal(
        micromark('a \\(\\) b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a () b</p>'
      )
    }
  )

  await t.test('should support non-empty \\[x\\] as math', async function () {
    assert.equal(
      micromark('\\[x\\]', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<div class="math math-display">' +
        renderToString('x', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test('should support non-empty \\(x\\) as math', async function () {
    assert.equal(
      micromark('a \\(x\\) b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('x') +
        '</span> b</p>'
    )
  })

  await t.test('should not treat \\[\\] brackets as math', async function () {
    assert.equal(
      micromark('\\[\\] brackets', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>[] brackets</p>'
    )
  })

  await t.test(
    'should not treat \\(\\) parentheses as math',
    async function () {
      assert.equal(
        micromark('\\(\\) parentheses', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>() parentheses</p>'
      )
    }
  )

  await t.test(
    'should support backslash commands in flow math',
    async function () {
      assert.equal(
        micromark('\\[\\alpha\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\alpha', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support \\\\ line breaks in flow math',
    async function () {
      assert.equal(
        micromark('\\[\\beta \\\\ \\gamma\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\beta \\\\ \\gamma', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support \\begin{aligned} in flow math',
    async function () {
      assert.equal(
        micromark('\\[\n\\begin{aligned}\na &= b\n\\end{aligned}\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\begin{aligned}\na &= b\n\\end{aligned}', {
            displayMode: true
          }) +
          '</div>'
      )
    }
  )
})

// ——— VS Code markdown-it-katex alignment tests ———
// These tests verify that the single-dollar delimiter behavior matches
// VS Code's `vscode-markdown-it-katex` (checking outer word boundaries
// instead of inner content adjacency).

test('math (VS Code alignment)', async function (t) {
  await t.test(
    'should render inline math with spaces around content',
    async function () {
      assert.equal(
        micromark("Euler's identity: $ e^{i \\pi} + 1 = 0 $", {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>Euler\'s identity: <span class="math math-inline">' +
          renderToString('e^{i \\pi} + 1 = 0') +
          '</span></p>'
      )
    }
  )

  await t.test('should render simple inline math', async function () {
    assert.equal(
      micromark('$1+1 = 2$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p><span class="math math-inline">' +
        renderToString('1+1 = 2') +
        '</span></p>'
    )
  })

  await t.test('should render math embedded in a word', async function () {
    assert.equal(
      micromark('The $N$-eigenvalue problem', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>The <span class="math math-inline">' +
        renderToString('N') +
        '</span>-eigenvalue problem</p>'
    )
  })

  await t.test(
    'should not parse isolated dollar sign (only one $)',
    async function () {
      assert.equal(
        micromark('It costs $5.', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>It costs $5.</p>'
      )
    }
  )

  await t.test(
    'should not parse isolated dollar sign with spaces',
    async function () {
      assert.equal(
        micromark('a $ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $ b</p>'
      )
    }
  )

  await t.test(
    'should not parse dollar sign in the middle of a word',
    async function () {
      assert.equal(
        micromark('a$b$c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a$b$c</p>'
      )
    }
  )

  await t.test(
    'should not parse when closing dollar is followed by a digit',
    async function () {
      assert.equal(
        micromark('$x$20', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$x$20</p>'
      )
    }
  )

  await t.test(
    'should not parse when closing dollar is followed by a letter',
    async function () {
      assert.equal(
        micromark('$x$abc', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$x$abc</p>'
      )
    }
  )

  await t.test('should not parse currency amounts', async function () {
    assert.equal(
      micromark('This costs $5 and $10.', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>This costs $5 and $10.</p>'
    )
  })

  await t.test('should not parse currency with comma', async function () {
    assert.equal(
      micromark('$20,000 and $30,000', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>$20,000 and $30,000</p>'
    )
  })

  await t.test('should render math preceded by punctuation', async function () {
    assert.equal(
      micromark('foo, $x^2$ bar', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>foo, <span class="math math-inline">' +
        renderToString('x^2') +
        '</span> bar</p>'
    )
  })

  await t.test('should render math followed by punctuation', async function () {
    assert.equal(
      micromark('$x^2$, bar', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p><span class="math math-inline">' +
        renderToString('x^2') +
        '</span>, bar</p>'
    )
  })

  await t.test('should render math preceded by colon', async function () {
    assert.equal(
      micromark('Identity: $e^{i\\pi} + 1 = 0$.', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>Identity: <span class="math math-inline">' +
        renderToString('e^{i\\pi} + 1 = 0') +
        '</span>.</p>'
    )
  })

  await t.test('should render the binomial theorem', async function () {
    assert.equal(
      micromark('$\\sum_{k=0}^n \\binom{n}{k} x^k y^{n-k} = (x+y)^n$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p><span class="math math-inline">' +
        renderToString('\\sum_{k=0}^n \\binom{n}{k} x^k y^{n-k} = (x+y)^n') +
        '</span></p>'
    )
  })
})
