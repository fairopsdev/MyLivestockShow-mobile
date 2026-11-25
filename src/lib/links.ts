import { router } from 'expo-router';

// Where a notification opens in the app (data.screen comes from Fair Central).
export function openFromNotification(data: Record<string, string>) {
  switch (data.screen) {
    case 'entry':
      if (data.entry_id) return router.push({ pathname: '/entry/[id]', params: { id: data.entry_id } });
      break;
    case 'conversation':
      if (data.conversation_id) return router.push({ pathname: '/messages/[id]', params: { id: data.conversation_id } });
      break;
    case 'documents':
      return router.push('/documents');
    case 'ring':
      return router.navigate({ pathname: '/live', params: { tab: 'ring', fair: data.organization_id || '' } });
    case 'results':
      return router.navigate({ pathname: '/live', params: { tab: 'results', fair: data.organization_id || '' } });
    case 'weigh_in':
      return router.navigate('/weigh-in');
  }
  router.push('/notifications');
}
