import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRule } from '../scripts/cohorts.js';
import rules from '../scripts/cohort-rules.js';

const s = (o) => ({
  refHost: '', source: 'direct', utm: {}, paid: [], device: 'desktop', bot: false, memory: {}, ...o,
});
const rule = (o) => matchRule(rules, s(o)).rule;

test('no signal keeps the original page', () => assert.equal(rule({}), null));
test('support.zendesk.com visitors are customers', () => {
  assert.equal(rule({ refHost: 'support.zendesk.com' }), 'from-portal');
  assert.equal(matchRule(rules, s({ refHost: 'support.zendesk.com' })).experience, 'customer');
});
test('a personal agent wins over its referrer', () => assert.equal(rule({ agent: 'chatgpt-agent', source: 'ai' }), 'personal-agent'));
test('AI referrals are prospects', () => assert.equal(rule({ source: 'ai' }), 'ai-referred'));
test('a cpc campaign is a prospect with the campaign intent', () => {
  const m = matchRule(rules, s({ utm: { medium: 'cpc', campaign: 'pricing-q3' } }));
  assert.equal(m.rule, 'campaign');
  assert.equal(m.intent, 'pricing');
});
test('portal beats campaign tags', () => assert.equal(rule({ refHost: 'support.zendesk.com', utm: { medium: 'email' } }), 'from-portal'));
test('first visit on a phone gets quick tasks', () => assert.equal(rule({ device: 'mobile', memory: { visits: 1 } }), 'mobile-first-visit'));
test('a returning phone visitor without interest keeps the original', () => assert.equal(rule({ device: 'mobile', memory: { visits: 3 } }), null));
test('bots keep the original page', () => assert.equal(rule({ bot: true, source: 'ai' }), null));
