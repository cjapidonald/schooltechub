import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mail, Phone, MapPin, Send, CalendarIcon, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    bookingType: "consultation",
    topic: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, we'll store contact form submissions locally
      console.log('Contact form submission:', formData);
      
      // You can implement email sending or save to a different table later
      // For now, just simulate success

      toast({
        title: t.contact.form.toast.successTitle,
        description: t.contact.form.toast.successDescription,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        school: "",
        bookingType: "consultation",
        topic: "",
        preferredDate: "",
        preferredTime: "",
        message: "",
      });
    } catch (error) {
      const fallbackDescription = t.contact.form.toast.errorDescription;
      const description =
        error instanceof Error && error.message
          ? error.message
          : fallbackDescription;

      toast({
        title: t.contact.form.toast.errorTitle,
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title={t.contact.seo.title}
        description={t.contact.seo.description}
        keywords={t.contact.seo.keywords}
        canonicalUrl="https://schooltechhub.com/contact"
        lang={language}
      />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/4 left-[-10rem] h-[22rem] w-[22rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-24 md:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-10 text-center shadow-[0_25px_80px_-20px_rgba(15,23,42,0.75)] backdrop-blur-2xl md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="absolute inset-y-0 right-[-25%] hidden w-[55%] rounded-full bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent blur-3xl md:block" />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {t.contact.hero.badge}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {t.contact.hero.title}
            </h1>
            <p className="text-lg text-white/70 md:text-xl">
              {t.contact.hero.subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                {t.contact.hero.highlights.personalized}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                {t.contact.hero.highlights.support}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                {t.contact.hero.highlights.futureReady}
              </span>
            </div>
          </div>
        </section>

        <section className="relative grid gap-10 lg:grid-cols-[1.1fr,1.6fr]">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="relative overflow-hidden border border-white/15 bg-white/10 p-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />
              <div className="relative space-y-5">
                <h3 className="text-lg font-semibold text-white">
                  {t.contact.info.quickContact.title}
                </h3>
                <div className="space-y-4 text-white/70">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-cyan-200" />
                    <div>
                      <p className="font-medium text-white">{t.contact.info.quickContact.email.label}</p>
                      <p className="text-sm">{t.contact.info.quickContact.email.value}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-emerald-200" />
                    <div>
                      <p className="font-medium text-white">{t.contact.info.quickContact.phone.label}</p>
                      <p className="text-sm">{t.contact.info.quickContact.phone.value}</p>
                      <p className="text-sm">{t.contact.info.quickContact.phone.whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-violet-200" />
                    <div>
                      <p className="font-medium text-white">{t.contact.info.quickContact.location.label}</p>
                      <p className="text-sm">{t.contact.info.quickContact.location.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <CalendarIcon className="mb-3 h-8 w-8 text-cyan-200" />
              <h3 className="text-lg font-semibold text-white">
                {t.contact.info.officeHours.title}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-white/70">
                <p>{t.contact.info.officeHours.weekdays}</p>
                <p>{t.contact.info.officeHours.saturday}</p>
                <p>{t.contact.info.officeHours.sunday}</p>
              </div>
            </Card>

            <Card className="border border-white/15 bg-white/10 p-6 text-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
              <MessageSquare className="mb-3 h-8 w-8 text-violet-200" />
              <h3 className="text-lg font-semibold text-white">
                {t.contact.info.responseTime.title}
              </h3>
              <p className="text-sm text-white/70">
                {t.contact.info.responseTime.description}
              </p>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="border border-white/15 bg-white/10 p-8 text-white shadow-[0_25px_70px_-30px_rgba(15,23,42,0.9)] backdrop-blur-2xl md:p-10">
              <h2 className="text-2xl font-semibold md:text-3xl">
                {t.contact.form.title}
              </h2>
              <p className="mt-3 text-sm text-white/70">
                {t.contact.form.subtitle}
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.name.label}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={t.contact.form.fields.name.placeholder}
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.email.label}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t.contact.form.fields.email.placeholder}
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.phone.label}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t.contact.form.fields.phone.placeholder}
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.school.label}
                    </Label>
                    <Input
                      id="school"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder={t.contact.form.fields.school.placeholder}
                      className="h-12 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white/80">
                    {t.contact.form.serviceType.label}
                  </Label>
                  <RadioGroup
                    value={formData.bookingType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, bookingType: value }))
                    }
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                      <RadioGroupItem
                        value="consultation"
                        id="consultation"
                        className="border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
                      />
                      <Label htmlFor="consultation" className="font-normal text-white/80">
                        {t.contact.form.serviceType.options.consultation}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                      <RadioGroupItem
                        value="whole_school"
                        id="whole_school"
                        className="border-white/40 text-white data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
                      />
                      <Label htmlFor="whole_school" className="font-normal text-white/80">
                        {t.contact.form.serviceType.options.wholeSchool}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.preferredDate.label}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 w-full justify-start rounded-2xl border-white/20 bg-white/10 text-left text-base font-normal text-white/80 hover:bg-white/20",
                            !formData.preferredDate && "text-white/50"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.preferredDate ? (
                            format(new Date(formData.preferredDate), "PPP")
                          ) : (
                            <span>{t.contact.form.fields.preferredDate.placeholder}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="z-[100] w-auto border border-white/15 bg-slate-950/80 p-0 text-white backdrop-blur"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={formData.preferredDate ? new Date(formData.preferredDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData((prev) => ({
                                ...prev,
                                preferredDate: format(date, "yyyy-MM-dd"),
                              }));
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto rounded-2xl bg-transparent p-3 text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime" className="text-sm font-medium text-white/80">
                      {t.contact.form.fields.preferredTime.label}
                    </Label>
                    <Select
                      value={formData.preferredTime}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, preferredTime: value }))
                      }
                    >
                      <SelectTrigger className="h-12 w-full rounded-2xl border-white/20 bg-white/10 text-left text-white placeholder:text-white/40">
                        <SelectValue placeholder={t.contact.form.fields.preferredTime.placeholder} />
                      </SelectTrigger>
                      <SelectContent className="z-[100] rounded-2xl border border-white/15 bg-slate-950/80 text-white backdrop-blur">
                        {t.contact.form.fields.preferredTime.options.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="data-[state=checked]:bg-white/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-white/80">
                    {t.contact.form.fields.topic.label}
                  </Label>
                  <Input
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    placeholder={t.contact.form.fields.topic.placeholder}
                    className="h-12 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-white/80">
                    {t.contact.form.fields.message.label}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t.contact.form.fields.message.placeholder}
                    className="min-h-[140px] rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-white/90 text-base font-semibold text-slate-900 shadow-[0_20px_60px_-25px_rgba(226,232,240,0.95)] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    t.contact.form.cta.loading
                  ) : (
                    <>
                      {t.contact.form.cta.idle}
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-white/60">
                  {t.contact.form.disclaimer}
                </p>
              </form>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;