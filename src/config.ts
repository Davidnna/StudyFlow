import type { Settings } from './types';

export const APP_NAME = 'StudyFlow';
export const SUPPORT_EMAIL = 'davedozie1@gmail.com';
export const MIN_SAVE_SECONDS = 60;
export const GOAL_PRESETS = [10, 15, 25, 30, 45, 60, 90];

export const KEYS = {
  onboarded: 'studyflow:onboarded',
};

export const DEFAULT_SETTINGS: Settings = {
  remindersOn: true,
  autoStartNext: true,
  muteNotifications: false,
  focusMinutes: 25,
  breakMinutes: 5,
  dailyGoalMinutes: 60,
  chartStyle: 'bar',
};
