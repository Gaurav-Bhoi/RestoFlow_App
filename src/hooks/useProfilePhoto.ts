import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFeedback } from '../app/FeedbackProvider';
import type { ProfilePhoto } from '../features/restaurant/types';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export function useProfilePhoto() {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<ProfilePhoto>();
  const showFeedback = useFeedback();
  const selectPhoto = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
      });
      if (response.didCancel) return;
      const asset = response.assets?.[0];
      if (
        response.errorCode ||
        !asset?.uri ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(asset.type ?? '')
      ) {
        showFeedback(t('common.thePhotoCouldNotBeOpenedTryAnotherPhoto'));
        return;
      }
      if ((asset.fileSize ?? 0) > MAX_PHOTO_BYTES) {
        showFeedback(t('common.chooseAnImageSmallerThan5Mb'));
        return;
      }
      const type = asset.type as ProfilePhoto['type'];
      setPhoto({
        uri: asset.uri,
        type,
        name: `profile.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`,
      });
    } catch {
      showFeedback(t('common.thePhotoLibraryIsUnavailable'));
    }
  };
  return { photo, selectPhoto };
}
