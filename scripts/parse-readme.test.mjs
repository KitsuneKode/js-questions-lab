import fs from 'node:fs';
import path from 'node:path';

const questionsPath = path.join(process.cwd(), 'content/generated/locales/en/questions.v1.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

function getQuestion(id) {
  return questions.find((q) => q.id === id);
}

let failed = false;

function assertTag(id, tag, shouldHave) {
  const q = getQuestion(id);
  if (!q) {
    console.error(`Failed: Question ${id} not found.`);
    failed = true;
    return;
  }
  const hasTag = q.tags.includes(tag);
  if (hasTag !== shouldHave) {
    console.error(
      `Failed: Question ${id} should ${shouldHave ? 'have' : 'NOT have'} tag '${tag}'. Tags are: ${q.tags.join(', ')}`,
    );
    failed = true;
  } else {
    console.log(`Passed: Question ${id} ${shouldHave ? 'has' : 'does not have'} tag '${tag}'.`);
  }
}

// Questions 54, 72, 129, 155 do NOT have dom-events tag
assertTag(54, 'dom-events', false);
assertTag(72, 'dom-events', false);
assertTag(129, 'dom-events', false);
assertTag(155, 'dom-events', false);

// Question 44 HAS generators tag
assertTag(44, 'generators', true);

// Question 72 HAS template-literals tag
assertTag(72, 'template-literals', true);

if (failed) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
