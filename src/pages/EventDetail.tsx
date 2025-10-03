import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import RichContent from "@/components/RichContent";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Video,
  Globe,
  Timer,
  Languages,
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["content_master"]["Row"];

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date", error);
    return null;
  }
};

const formatTime = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), "h:mm a");
  } catch (error) {
    console.error("Error formatting time", error);
    return null;
  }
};

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Event | null>({
    queryKey: ["event-detail", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-64 w-full bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl">Event Not Found</CardTitle>
            <p className="text-muted-foreground">
              The event you're looking for couldn't be found.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(getLocalizedPath("/events", language))}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPastEvent = event.start_datetime ? new Date(event.start_datetime) < new Date() : false;
  const eventDate = formatDate(event.start_datetime);
  const eventTime = formatTime(event.start_datetime);
  const endTime = formatTime(event.end_datetime);

  return (
    <>
      <SEO
        title={event.meta_title || event.title}
        description={event.meta_description || event.excerpt}
        image={event.featured_image || undefined}
        keywords={event.keywords?.join(", ")}
      />

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate(getLocalizedPath("/events", language))}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {event.event_type && <Badge variant={isPastEvent ? "secondary" : "default"}>{event.event_type}</Badge>}
                {event.event_mode && <Badge variant="outline">{event.event_mode}</Badge>}
                {event.event_price_type && (
                  <Badge variant={event.event_price_type === "Free" ? "secondary" : "outline"}>
                    {event.event_price_type}
                    {event.price && event.event_price_type === "Paid" && ` $${event.price}`}
                  </Badge>
                )}
                {event.event_certificate_pd && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Award className="h-3 w-3 mr-1" />
                    PD Certificate
                  </Badge>
                )}
                {isPastEvent && event.recording_url && (
                  <Badge className="bg-green-100 text-green-800">
                    <Video className="h-3 w-3 mr-1" />
                    Recording Available
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

              {event.subtitle && (
                <p className="text-lg text-muted-foreground mb-6">{event.subtitle}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 mb-8 text-sm text-muted-foreground">
                {eventDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{eventDate}</span>
                  </div>
                )}
                {(eventTime || endTime) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {eventTime}
                      {endTime && ` - ${endTime}`}
                      {event.event_timezone ? ` ${event.event_timezone}` : ""}
                    </span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.event_language && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <span>{event.event_language}</span>
                  </div>
                )}
                {event.event_host && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{event.event_host}</span>
                  </div>
                )}
                {event.event_duration && (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span>{event.event_duration}</span>
                  </div>
                )}
                {event.event_capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      Capacity: {event.event_capacity}
                      {typeof event.event_registered === "number" &&
                        ` • Registered: ${event.event_registered}`}
                    </span>
                  </div>
                )}
              </div>

              {event.featured_image && (
                <div className="mb-8 overflow-hidden rounded-lg">
                  <img
                    src={event.featured_image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <RichContent content={event.content} />
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isPastEvent && event.registration_url && (
                    <Button asChild className="w-full">
                      <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                        Register Now
                      </a>
                    </Button>
                  )}
                  {isPastEvent && event.recording_url && (
                    <Button asChild variant="secondary" className="w-full">
                      <a href={event.recording_url} target="_blank" rel="noopener noreferrer">
                        Watch Recording
                      </a>
                    </Button>
                  )}
                  {event.registration_url && isPastEvent && !event.recording_url && (
                    <p className="text-sm text-muted-foreground">
                      This event has passed. Registration is now closed.
                    </p>
                  )}
                  {event.registration_url && !isPastEvent && (
                    <p className="text-xs text-muted-foreground">
                      You will be redirected to an external registration page.
                    </p>
                  )}
                </CardContent>
              </Card>

              {(event.stage || event.subject || (event.tags && event.tags.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Audience & Topics</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {event.stage && <Badge variant="outline">{event.stage}</Badge>}
                    {event.subject && <Badge variant="outline">{event.subject}</Badge>}
                    {event.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </article>
    </>
  );
};

export default EventDetail;
