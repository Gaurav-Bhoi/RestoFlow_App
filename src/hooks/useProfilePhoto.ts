import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFeedback } from '../app/FeedbackProvider';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export function useProfilePhoto() {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<string>();
  const showFeedback = useFeedback();
  const selectPhoto = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: true,
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
      });
      if (response.didCancel) {
        return;
      }
      const asset = response.assets?.[0];
      if (response.errorCode || !asset?.base64) {
        showFeedback(t('common.thePhotoCouldNotBeOpenedTryAnotherPhoto'));
        return;
      }
      if ((asset.fileSize ?? 0) > MAX_PHOTO_BYTES) {
        showFeedback(t('common.chooseAnImageSmallerThan5Mb'));
        return;
      }
      // Store the resized image rather than an OS picker URI that may expire.
      setPhoto(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
    } catch {
      showFeedback(t('common.thePhotoLibraryIsUnavailable'));
    }
  };
  return { photo, selectPhoto };
}
