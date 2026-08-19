import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import { OrganizerApplicationConfirmation } from '@/components/become-organizer/organizer-application-confirmation';
import { OrganizerApplicationForm } from '@/components/become-organizer/organizer-application-form';
import { OrganizerBenefitCards } from '@/components/become-organizer/organizer-benefit-cards';
import { OrganizerEligibilitySection } from '@/components/become-organizer/organizer-eligibility-section';
import { OrganizerHeroSection } from '@/components/become-organizer/organizer-hero-section';
import { ScreenLayout } from '@/components/screen-layout';

/** Information and application page for prospective SeniorHub organizers. */
export default function BecomeOrganizerScreen() {
  const router = useRouter();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  return (
    <ScreenLayout
      title="Bli arrangör"
      subtitle="Information och ansökan"
      showBackButton
      omitTabInset>
      {hasSubmitted ? (
        <OrganizerApplicationConfirmation
          onBackHome={() => router.replace('/' as Href)}
        />
      ) : (
        <>
          <OrganizerHeroSection />
          <OrganizerBenefitCards />
          <OrganizerEligibilitySection />
          <OrganizerApplicationForm onSubmit={() => setHasSubmitted(true)} />
        </>
      )}
    </ScreenLayout>
  );
}
