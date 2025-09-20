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
import { Mail, Phone, MapPin, Send, CalendarIcon, MessageSquare } from "lucide-react";
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
    <div className="min-h-screen flex flex-col">
      <SEO
        title={t.contact.seo.title}
        description={t.contact.seo.description}
        keywords={t.contact.seo.keywords}
        canonicalUrl="https://schooltechhub.com/contact"
        lang={language}
      />
      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.contact.hero.title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.contact.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-16 px-4 flex-1">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">{t.contact.info.quickContact.title}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{t.contact.info.quickContact.email.label}</p>
                      <p className="text-sm text-muted-foreground">{t.contact.info.quickContact.email.value}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{t.contact.info.quickContact.phone.label}</p>
                      <p className="text-sm text-muted-foreground">{t.contact.info.quickContact.phone.value}</p>
                      <p className="text-sm text-muted-foreground">{t.contact.info.quickContact.phone.whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{t.contact.info.quickContact.location.label}</p>
                      <p className="text-sm text-muted-foreground">{t.contact.info.quickContact.location.description}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CalendarIcon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t.contact.info.officeHours.title}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t.contact.info.officeHours.weekdays}</p>
                  <p>{t.contact.info.officeHours.saturday}</p>
                  <p>{t.contact.info.officeHours.sunday}</p>
                </div>
              </Card>

              <Card className="p-6">
                <MessageSquare className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t.contact.info.responseTime.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.contact.info.responseTime.description}
                </p>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">{t.contact.form.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">{t.contact.form.fields.name.label}</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t.contact.form.fields.name.placeholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t.contact.form.fields.email.label}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t.contact.form.fields.email.placeholder}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">{t.contact.form.fields.phone.label}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t.contact.form.fields.phone.placeholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="school">{t.contact.form.fields.school.label}</Label>
                      <Input
                        id="school"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        placeholder={t.contact.form.fields.school.placeholder}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t.contact.form.serviceType.label}</Label>
                    <RadioGroup
                      value={formData.bookingType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, bookingType: value }))
                      }
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="consultation" id="consultation" />
                        <Label htmlFor="consultation" className="font-normal">
                          {t.contact.form.serviceType.options.consultation}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whole_school" id="whole_school" />
                        <Label htmlFor="whole_school" className="font-normal">
                          {t.contact.form.serviceType.options.wholeSchool}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="preferredDate">{t.contact.form.fields.preferredDate.label}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.preferredDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.preferredDate
                              ? format(new Date(formData.preferredDate), "PPP")
                              : <span>{t.contact.form.fields.preferredDate.placeholder}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[100]" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.preferredDate ? new Date(formData.preferredDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setFormData(prev => ({
                                  ...prev,
                                  preferredDate: format(date, "yyyy-MM-dd")
                                }));
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">{t.contact.form.fields.preferredTime.label}</Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t.contact.form.fields.preferredTime.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {t.contact.form.fields.preferredTime.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="topic">{t.contact.form.fields.topic.label}</Label>
                    <Input
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      placeholder={t.contact.form.fields.topic.placeholder}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">{t.contact.form.fields.message.label}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t.contact.form.fields.message.placeholder}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      t.contact.form.cta.loading
                    ) : (
                      <>
                        {t.contact.form.cta.idle}
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    {t.contact.form.disclaimer}
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;