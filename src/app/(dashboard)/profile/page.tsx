import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/rbac';
import { updateOwnMenteeProfileForm, updateOwnMentorProfileForm } from '@/features/profiles/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Field({
  id,
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string | number | null;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} defaultValue={defaultValue ?? ''} />
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  const t = await getTranslations('profile');

  const [mentorProfile, menteeProfile] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      include: { competencies: { include: { competency: true } } },
    }),
    prisma.menteeProfile.findUnique({
      where: { userId: user.id },
      include: { competencies: { include: { competency: true } } },
    }),
  ]);

  if (!mentorProfile && !menteeProfile) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('noProfile')}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {mentorProfile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {mentorProfile.fullName}{' '}
              <Badge variant="secondary">{mentorProfile.preferredLanguage}</Badge>
            </CardTitle>
            {mentorProfile.competencies.length > 0 ? (
              <p className="flex flex-wrap gap-1 pt-1">
                {mentorProfile.competencies.map((c) => (
                  <Badge key={c.id} variant="outline">
                    {c.competency.name}
                  </Badge>
                ))}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action={updateOwnMentorProfileForm} className="grid gap-4 sm:grid-cols-2">
              <Field id="phone" label={t('phone')} name="phone" defaultValue={mentorProfile.phone} />
              <Field id="department" label={t('department')} name="department" defaultValue={mentorProfile.department} />
              <Field id="jobTitle" label={t('jobTitle')} name="jobTitle" defaultValue={mentorProfile.jobTitle} />
              <Field id="location" label={t('location')} name="location" defaultValue={mentorProfile.location} />
              <Field id="yearsExperience" label={t('yearsExperience')} name="yearsExperience" type="number" defaultValue={mentorProfile.yearsExperience} />
              <Field id="personality" label={t('personality')} name="personality" defaultValue={mentorProfile.personality} />
              <Field id="availability" label={t('availability')} name="availability" defaultValue={mentorProfile.availability} />
              <Field id="interests" label={t('interests')} name="interests" defaultValue={mentorProfile.interests} />
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="whyMentor">{t('whyMentor')}</Label>
                <Input id="whyMentor" name="whyMentor" defaultValue={mentorProfile.whyMentor ?? ''} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="whatCanLearn">{t('whatCanLearn')}</Label>
                <Input id="whatCanLearn" name="whatCanLearn" defaultValue={mentorProfile.whatCanLearn ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {menteeProfile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {menteeProfile.fullName}{' '}
              <Badge variant="secondary">{menteeProfile.preferredLanguage}</Badge>
            </CardTitle>
            {menteeProfile.competencies.length > 0 ? (
              <p className="flex flex-wrap gap-1 pt-1">
                {menteeProfile.competencies.map((c) => (
                  <Badge key={c.id} variant={c.isToStrengthen ? 'outline' : 'secondary'}>
                    {c.competency.name}
                  </Badge>
                ))}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action={updateOwnMenteeProfileForm} className="grid gap-4 sm:grid-cols-2">
              <Field id="m-phone" label={t('phone')} name="phone" defaultValue={menteeProfile.phone} />
              <Field id="m-department" label={t('department')} name="department" defaultValue={menteeProfile.department} />
              <Field id="m-jobTitle" label={t('jobTitle')} name="jobTitle" defaultValue={menteeProfile.jobTitle} />
              <Field id="m-location" label={t('location')} name="location" defaultValue={menteeProfile.location} />
              <Field id="m-currentGrade" label={t('currentGrade')} name="currentGrade" defaultValue={menteeProfile.currentGrade} />
              <Field id="m-personality" label={t('personality')} name="personality" defaultValue={menteeProfile.personality} />
              <Field id="m-interests" label={t('interests')} name="interests" defaultValue={menteeProfile.interests} />
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="m-whyMentor">{t('whyMentee')}</Label>
                <Input id="m-whyMentor" name="whyMentor" defaultValue={menteeProfile.whyMentor ?? ''} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="m-careerGoals">{t('careerGoals')}</Label>
                <Input id="m-careerGoals" name="careerGoals" defaultValue={menteeProfile.careerGoals ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
