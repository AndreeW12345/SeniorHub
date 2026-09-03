import { getAuth } from 'firebase-admin/auth';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

/**
 * Set before deploy:
 *   firebase functions:secrets:set MOBILE_AUTH_LINKS_SETUP_SECRET
 *
 * The previously hardcoded value `seniorhub-mobile-links-setup` was exposed in Git
 * and MUST be rotated — do not reuse it.
 */
export const MOBILE_AUTH_LINKS_SETUP_SECRET = defineSecret('MOBILE_AUTH_LINKS_SETUP_SECRET');

/** Firebase Hosting domain for mobileLinksConfig, e.g. seniorhub.se */
export const HOSTING_DOMAIN = defineString('HOSTING_DOMAIN', {
  default: '',
  description: 'Firebase Hosting domain used for Auth mobile/app links.',
});

/**
 * One-time HTTP endpoint to set Firebase Auth mobileLinksConfig.domain.
 * Uses the Cloud Functions service account (no local service account JSON required).
 *
 * Deploy:  firebase deploy --only functions:configureMobileAuthLinks
 * Invoke:  MOBILE_AUTH_LINKS_SETUP_SECRET=... npm run configure:mobile-auth-links:remote
 *
 * Disable or delete this function after successful setup to reduce attack surface.
 */
export const configureMobileAuthLinks = onRequest(
  { secrets: [MOBILE_AUTH_LINKS_SETUP_SECRET] },
  async (req, res) => {
    const providedSecret = typeof req.query.secret === 'string' ? req.query.secret : '';
    if (!providedSecret || providedSecret !== MOBILE_AUTH_LINKS_SETUP_SECRET.value()) {
      res.status(403).json({
        ok: false,
        error: 'Forbidden. Provide the correct ?secret= query parameter.',
      });
      return;
    }

    const domain = HOSTING_DOMAIN.value().trim();
    if (!domain) {
      res.status(500).json({
        ok: false,
        error: 'HOSTING_DOMAIN is not configured for this function deployment.',
      });
      return;
    }

    try {
      const projectConfigManager = getAuth().projectConfigManager();
      const before = await projectConfigManager.getProjectConfig();

      if (before.mobileLinksConfig?.domain === domain) {
        res.json({
          ok: true,
          alreadyConfigured: true,
          domain,
          note: 'mobileLinksConfig.domain already matches HOSTING_DOMAIN. Consider disabling this function.',
        });
        return;
      }

      const after = await projectConfigManager.updateProjectConfig({
        mobileLinksConfig: {
          domain: domain as never,
        },
      });

      res.json({
        ok: true,
        before: before.mobileLinksConfig ?? null,
        after: after.mobileLinksConfig ?? null,
        note: 'Setup complete. Disable configureMobileAuthLinks in production when no longer needed.',
      });
    } catch (error) {
      console.error('[configureMobileAuthLinks] Failed:', error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
);
