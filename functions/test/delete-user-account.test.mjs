import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';

import { finalizeAccountDeletion } from '../lib/callable/delete-user-account.js';

describe('finalizeAccountDeletion', () => {
  it('A: Auth delete fail does not complete user deletion or return ok', async () => {
    let userDeleteCalled = false;
    let adminDeleteCalled = false;

    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {
            throw new HttpsError('internal', 'Auth failed');
          },
          deleteUserDocument: async () => {
            userDeleteCalled = true;
          },
          deleteSelfAdminDocument: async () => {
            adminDeleteCalled = true;
          },
          userDocumentExists: async () => true,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );

    assert.equal(userDeleteCalled, false);
    assert.equal(adminDeleteCalled, false);
  });

  it('B: Auth OK + users delete fail does not return ok', async () => {
    let adminDeleteCalled = false;

    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {},
          deleteUserDocument: async () => {
            throw new Error('firestore delete failed');
          },
          deleteSelfAdminDocument: async () => {
            adminDeleteCalled = true;
          },
          userDocumentExists: async () => true,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );

    assert.equal(adminDeleteCalled, false);
  });

  it('C: Auth OK + users delete OK removes self admin doc before ok', async () => {
    const admins = {
      user1: { email: 'admin@example.com', organizationId: 'org-a', role: 'admin' },
    };

    const result = await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {},
      deleteUserDocument: async () => {},
      deleteSelfAdminDocument: async (uid) => {
        delete admins[uid];
      },
      userDocumentExists: async () => false,
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(admins.user1, undefined);
  });

  it('D: full successful finalization returns ok', async () => {
    const result = await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {},
      deleteUserDocument: async () => {},
      deleteSelfAdminDocument: async () => {},
      userDocumentExists: async () => false,
    });

    assert.deepEqual(result, { ok: true });
  });

  it('E: self admin delete does not remove other admin documents', async () => {
    const admins = {
      user1: { email: 'self@example.com', organizationId: 'org-a', role: 'admin' },
      'other-admin': { email: 'other@example.com', organizationId: 'org-b', role: 'admin' },
    };

    await finalizeAccountDeletion('user1', {
      deleteAuthUser: async () => {},
      deleteUserDocument: async () => {},
      deleteSelfAdminDocument: async (uid) => {
        delete admins[uid];
      },
      userDocumentExists: async () => false,
    });

    assert.equal(admins.user1, undefined);
    assert.ok(admins['other-admin']);
    assert.equal(admins['other-admin'].organizationId, 'org-b');
  });

  it('does not return ok when user profile still exists after deletion steps', async () => {
    await assert.rejects(
      () =>
        finalizeAccountDeletion('user1', {
          deleteAuthUser: async () => {},
          deleteUserDocument: async () => {},
          deleteSelfAdminDocument: async () => {},
          userDocumentExists: async () => true,
        }),
      (error) => error instanceof HttpsError && error.code === 'internal',
    );
  });
});
