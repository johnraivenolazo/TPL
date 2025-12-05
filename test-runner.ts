import { readFileSync } from 'fs';
import { lexSource } from './src/services/lexer.service';
import { buildAst } from './src/services/parser.service';
import { semanticCheck } from './src/services/semantic.service';

const testCases = [
  { file: 'tests/01-all-pass.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'PASS' },
  { file: 'tests/02-syntax-error-invalid-identifier.txt', expectLex: 'PASS', expectSyntax: 'ERROR', expectSemantic: 'N/A' },
  { file: 'tests/03-semantic-error-type-mismatch.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'ERROR' },
  { file: 'tests/04-lexical-error-invalid-char.txt', expectLex: 'ERROR', expectSyntax: 'N/A', expectSemantic: 'N/A' },
  { file: 'tests/05-lexical-error-invalid-char-literal.txt', expectLex: 'ERROR', expectSyntax: 'N/A', expectSemantic: 'N/A' },
  { file: 'tests/06-syntax-error-missing-semicolon.txt', expectLex: 'PASS', expectSyntax: 'ERROR', expectSemantic: 'N/A' },
  { file: 'tests/07-syntax-error-invalid-type.txt', expectLex: 'PASS', expectSyntax: 'ERROR', expectSemantic: 'N/A' },
  { file: 'tests/08-semantic-error-duplicate-variable.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'ERROR' },
  { file: 'tests/09-all-types-valid.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'PASS' },
  { file: 'tests/10-widening-conversion-valid.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'PASS' },
  { file: 'tests/11-escape-sequences.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'PASS' },
  { file: 'tests/12-negative-numbers.txt', expectLex: 'PASS', expectSyntax: 'PASS', expectSemantic: 'PASS' },
];

let passed = 0;
let failed = 0;

console.log('🔍 Running Compiler Test Suite...\n');

for (const test of testCases) {
  const source = readFileSync(test.file, 'utf-8');
  let lexResult = 'PASS';
  let syntaxResult = 'PASS';
  let semanticResult = 'PASS';
  let tokens: any, ast: any;

  console.log(`📄 Testing: ${test.file}`);

  // Lexical Phase
  try {
    tokens = lexSource(source);
    lexResult = 'PASS';
  } catch (e: any) {
    lexResult = 'ERROR';
    console.log(`   ❌ Lexical: ${e.message}`);
  }

  // Syntax Phase
  if (lexResult === 'PASS') {
    try {
      ast = buildAst(source);
      syntaxResult = 'PASS';
    } catch (e: any) {
      syntaxResult = 'ERROR';
      console.log(`   ❌ Syntax: ${e.message}`);
    }
  } else {
    syntaxResult = 'N/A';
  }

  // Semantic Phase
  if (syntaxResult === 'PASS') {
    try {
      const findings = semanticCheck(ast);
      const hasErrors = findings.some(f => f.level === 'error');
      semanticResult = hasErrors ? 'ERROR' : 'PASS';
      if (hasErrors) {
        const errorMsg = findings.filter(f => f.level === 'error').map(f => f.message).join(', ');
        console.log(`   ❌ Semantic: ${errorMsg}`);
      }
    } catch (e: any) {
      semanticResult = 'ERROR';
      console.log(`   ❌ Semantic: ${e.message}`);
    }
  } else {
    semanticResult = 'N/A';
  }

  // Verify expectations
  const lexMatch = test.expectLex === lexResult;
  const syntaxMatch = test.expectSyntax === syntaxResult || test.expectSyntax === 'N/A';
  const semanticMatch = test.expectSemantic === semanticResult || test.expectSemantic === 'N/A';

  if (lexMatch && syntaxMatch && semanticMatch) {
    console.log(`   ✅ PASS (Lex: ${lexResult}, Syntax: ${syntaxResult}, Semantic: ${semanticResult})\n`);
    passed++;
  } else {
    console.log(`   ❌ FAIL`);
    console.log(`      Expected: Lex=${test.expectLex}, Syntax=${test.expectSyntax}, Semantic=${test.expectSemantic}`);
    console.log(`      Got:      Lex=${lexResult}, Syntax=${syntaxResult}, Semantic=${semanticResult}\n`);
    failed++;
  }
}

console.log('═'.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED!\n');
} else {
  console.log('💥 SOME TESTS FAILED!\n');
  process.exit(1);
}
