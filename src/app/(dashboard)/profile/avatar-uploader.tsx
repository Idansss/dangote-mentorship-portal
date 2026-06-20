'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  removeOwnAvatar,
  uploadOwnAvatar,
  type ProfileActionState,
} from '@/features/profiles/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AvatarUploader({
  imageUrl,
  initials,
}: {
  imageUrl: string | null;
  initials: string;
}) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const fileId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);

  const [uploadState, upload, uploading] = useActionState<ProfileActionState, FormData>(
    uploadOwnAvatar,
    null,
  );
  const [removeState, remove, removing] = useActionState<ProfileActionState, FormData>(
    removeOwnAvatar,
    null,
  );

  useEffect(() => {
    if (uploadState?.ok || removeState?.ok) {
      formRef.current?.reset();
      setPreview(null);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadState, removeState]);

  const shown = preview ?? imageUrl;
  const error =
    (uploadState && !uploadState.ok && uploadState.error.message) ||
    (removeState && !removeState.ok && removeState.error.message) ||
    null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar className="size-16 ring-2 ring-border">
        {shown ? <AvatarImage src={shown} alt="" /> : null}
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <form ref={formRef} action={upload} className="flex flex-wrap items-center gap-2">
          <Input
            id={fileId}
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="max-w-xs"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? tc('loading') : t('uploadPhoto')}
          </Button>
        </form>

        {imageUrl ? (
          <form action={remove}>
            <Button type="submit" size="sm" variant="ghost" disabled={removing}>
              {removing ? tc('loading') : t('removePhoto')}
            </Button>
          </form>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('photoHint')}</p>
        )}
      </div>
    </div>
  );
}
