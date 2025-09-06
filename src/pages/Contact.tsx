import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, Phone, MapPin, Send, Calendar, MessageSquare } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
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
      const { error } = await supabase.from("bookings").insert([
        {
          booking_type: formData.bookingType as any,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone || null,
          school_name: formData.school || null,
          preferred_date: formData.preferredDate || new Date().toISOString().split('T')[0],
          preferred_time: formData.preferredTime || null,
          topic: formData.topic || null,
          additional_notes: formData.message || null,
          total_amount: formData.bookingType === "consultation" ? 20 : formData.bookingType === "mini_audit" ? 150 : 500,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Booking request sent!",
        description: "We'll get back to you within 24 hours to confirm your session.",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send booking request. Please try again.",
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
      <Navigation />

      {/* Header */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your classroom with technology? Let's start the conversation.
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
                <h3 className="font-semibold mb-4">Quick Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">support@schooltechhub.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">1-800-TECH-EDU</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">Serving schools nationwide (US)</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                <Calendar className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Office Hours</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Monday - Friday: 8am - 6pm EST</p>
                  <p>Saturday: 10am - 2pm EST</p>
                  <p>Sunday: Closed</p>
                </div>
              </Card>

              <Card className="p-6">
                <MessageSquare className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours during business days. 
                  Urgent requests are prioritized.
                </p>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Book a Session</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="jane@school.edu"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="school">School/Organization</Label>
                      <Input
                        id="school"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        placeholder="Lincoln Elementary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Service Type *</Label>
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
                          1-Hour Consultation ($20)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mini_audit" id="mini_audit" />
                        <Label htmlFor="mini_audit" className="font-normal">
                          Mini Tech Audit ($150)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="workshop" id="workshop" />
                        <Label htmlFor="workshop" className="font-normal">
                          PD Workshop ($500)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="preferredDate">Preferred Date</Label>
                      <Input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">Preferred Time</Label>
                      <Input
                        id="preferredTime"
                        name="preferredTime"
                        type="time"
                        value={formData.preferredTime}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="topic">Topic/Challenge to Address</Label>
                    <Input
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      placeholder="e.g., Implementing AI tools, Google Classroom setup"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Additional Information</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your goals and any specific requirements..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Booking Request
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    By submitting this form, you agree to our terms of service and privacy policy. 
                    We'll never share your information with third parties.
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;