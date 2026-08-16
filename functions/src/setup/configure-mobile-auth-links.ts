import { getAuth } from 'firebase-admin/auth';
import { onRequest } from 'firebase-functions/v2/https';

/** One-time setup secret — pass as ?secret= when invoking after deploy. */
const SETUP_SECRET = 'seniorhub-mobile-links-setup';

/**
 * One-time HTTP endpoint to set Firebase Auth mobileLinksConfig.domain to HOSTING_DOMAIN.
 * Uses the Cloud Functions service account (no local service account JSON required).
 *
 * Deploy:  firebase deploy --only functions:configureMobileAuthLinks
 * Invoke:  npm run configure:mobile-auth-links:remote
 */
export const configureMobileAuthLinks = onRequest(async (req, res) => {
  if (req.query.secret !== SETUP_SECRET) {
    res.status(403).json({ ok: false, error: 'Forbidden. Provide the correct ?secret= query parameter.' });
    return;
  }

  try {
    const projectConfigManager = getAuth().projectConfigManager();
    const before = await projectConfigManager.getProjectConfig();
    const after = await projectConfigManager.updateProjectConfig({
      mobileLinksConfig: {
        domain: 'HOSTING_DOMAIN',
      },
    });

    res.json({
      ok: true,
      before: before.mobileLinksConfig ?? null,
      after: after.mobileLinksConfig ?? null,
      note: 'Client ActionCodeSettings.linkDomain must match your deployed Hosting site (e.g. seniorhub-se.web.app).',
    });
  } catch (error) {
    console.error('[configureMobileAuthLinks] Failed:', error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
