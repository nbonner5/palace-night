import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useLayout } from '../theme/layout';
import { TUTORIAL_STEPS } from './tutorialSteps';

interface TutorialScreenProps {
  onBack: () => void;
}

export function TutorialScreen({ onBack }: TutorialScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const { isNarrow } = useLayout();

  const step = TUTORIAL_STEPS[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2190'} Home</Text>
        </Pressable>

        <Text style={styles.stepCounter}>
          {stepIndex + 1} / {TUTORIAL_STEPS.length}
        </Text>

        <View style={[styles.panel, isNarrow && styles.panelNarrow]}>
          <Text style={styles.stepTitle}>{step.title}</Text>

          {step.renderIllustration && (
            <View style={styles.illustrationArea}>
              {step.renderIllustration()}
            </View>
          )}

          <Text style={styles.bodyText}>{step.body}</Text>
        </View>

        <View style={styles.navRow}>
          <Pressable
            onPress={() => setStepIndex(i => i - 1)}
            style={[styles.navButton, isFirst && styles.navButtonHidden]}
            disabled={isFirst}
          >
            <Text style={styles.navButtonText}>Back</Text>
          </Pressable>

          {isLast ? (
            <Pressable onPress={onBack} style={styles.doneButton}>
              <Text style={styles.navButtonText}>Done</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setStepIndex(i => i + 1)}
              style={styles.nextButton}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.tableDark,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepCounter: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxWidth: '90%',
    gap: 16,
    alignItems: 'center',
  },
  panelNarrow: {
    padding: 16,
    width: 300,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.turnGold,
    textAlign: 'center',
  },
  illustrationArea: {
    paddingVertical: 8,
  },
  bodyText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  navButtonHidden: {
    opacity: 0,
  },
  navButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  doneButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
});
