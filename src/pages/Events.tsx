import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Clock, MapPin, Users, Video, Award, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format, differenceInMilliseconds } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

const Events = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventMode: searchParams.getAll("eventMode") || [],
    eventPriceType: searchParams.getAll("eventPriceType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || []
  });

  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "Workshop", label: "Workshops" },
    { value: "Webinar", label: "Webinars" },
    { value: "Meetup", label: "Meetups" },
    { value: "upcoming", label: "Upcoming Events" },
    { value: "past", label: "Past Events & Recordings" }
  ];

  const filterOptions = {
    eventMode: ["Online", "In-person", "Hybrid", "Live"],
    eventPriceType: ["Free", "Paid"],
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Lower Primary", "Upper Primary", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "Reading", "Writing", "Grammar", "Spelling", "Vocabulary", "English/ELA", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "ICT", "STEM", "STEAM"]
  };

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedType, filters]);

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      setEvents(prev => [...prev]); // Force re-render
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("*")
        .eq("is_published", true);

      if (selectedType === "upcoming") {
        query = query.gte("start_datetime", new Date().toISOString());
      } else if (selectedType === "past") {
        query = query.lt("start_datetime", new Date().toISOString());
      } else if (selectedType !== "all") {
        query = query.eq("event_type", selectedType as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.eventMode.length > 0) {
        query = query.in("event_mode", filters.eventMode as any);
      }

      if (filters.eventPriceType.length > 0) {
        query = query.in("event_price_type", filters.eventPriceType as any);
      }

      // Note: stage and subject filters removed as they don't exist in events table

      const { data, error } = await query.order("start_datetime", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter(v => v !== value)
        : [...filters[filterType], value]
    };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    newFilters[filterType].forEach(v => params.append(filterType, v));
    setSearchParams(params);
  };

  const getCountdown = (startDate: string) => {
    const diff = differenceInMilliseconds(new Date(startDate), new Date());
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} to go`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} to go`;
    return "Starting soon";
  };

  const getSeatsAvailable = (capacity: number, registered: number) => {
    const available = capacity - registered;
    if (available <= 0) return <Badge variant="destructive">Full</Badge>;
    if (available <= 5) return <Badge variant="secondary">{available} seats left</Badge>;
    return <Badge variant="outline">{available}/{capacity} seats</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="EdTech Events: Webinars, Workshops & Meetups"
        description="Join live EdTech webinars, workshops, and meetups. Browse upcoming and past events, and watch recordings to level up your classroom technology skills."
        canonicalUrl="https://schooltechhub.com/events"
      />

      <div className="flex-1">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <CalendarClock className="h-10 w-10" />
              EdTech Events
            </h1>
            <p className="text-muted-foreground">
              Join webinars, workshops, meetups—see upcoming, past, and recordings.
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {eventTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Delivery/Mode</h4>
                    {filterOptions.eventMode.map((mode) => (
                      <label key={mode} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.eventMode.includes(mode)}
                          onChange={() => toggleFilter("eventMode", mode)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{mode}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Price Type</h4>
                    {filterOptions.eventPriceType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.eventPriceType.includes(type)}
                          onChange={() => toggleFilter("eventPriceType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Stage (Optional)</h4>
                    {filterOptions.stage.map((stage) => (
                      <label key={stage} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={filters.stage.includes(stage)}
                          onChange={() => toggleFilter("stage", stage)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{stage}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Newsletter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get notified about upcoming events and recordings!
                  </p>
                  <Button className="w-full">Subscribe</Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No events found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {events.map((event) => {
                    const countdown = event.start_datetime ? getCountdown(event.start_datetime) : null;
                    const isPast = event.start_datetime && new Date(event.start_datetime) < new Date();
                    
                    return (
                      <Card key={event.id} className={`hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={isPast ? "secondary" : "default"}>
                                {event.event_type}
                              </Badge>
                              <Badge variant="outline">
                                {event.event_mode}
                              </Badge>
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
                            </div>
                            {(!isPast && countdown) || (isPast && event.recording_url) ? (
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                {!isPast && countdown && (
                                  <Badge variant="destructive">{countdown}</Badge>
                                )}
                                {isPast && event.recording_url && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <Video className="h-3 w-3 mr-1" />
                                    Recording Available
                                  </Badge>
                                )}
                              </div>
                            ) : null}
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2">
                            <Link
                              to={getLocalizedPath(`/events/${event.slug}`, language)}
                              className="hover:text-primary"
                            >
                              {event.title}
                            </Link>
                          </h3>
                          
                          {event.subtitle && (
                            <p className="text-sm text-muted-foreground mb-2">{event.subtitle}</p>
                          )}
                          
                          <p className="text-muted-foreground mb-4">
                            {event.excerpt || "Click for more details..."}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {event.start_datetime && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                {format(new Date(event.start_datetime), "MMM d, yyyy")}
                              </div>
                            )}
                            {event.start_datetime && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                {format(new Date(event.start_datetime), "h:mm a")} Bangkok
                              </div>
                            )}
                            {event.venue && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2" />
                                {event.venue}
                              </div>
                            )}
                            {event.event_capacity && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="h-4 w-4 mr-2" />
                                {getSeatsAvailable(event.event_capacity, event.event_registered || 0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {!isPast && event.registration_url && (
                              <Button asChild>
                                <Link to={event.registration_url}>Register Now</Link>
                              </Button>
                            )}
                            {isPast && event.recording_url && (
                              <Button asChild variant="secondary">
                                <a href={event.recording_url} target="_blank" rel="noopener noreferrer">
                                  Watch Recording
                                </a>
                              </Button>
                            )}
                            <Button variant="outline" asChild>
                              <Link to={getLocalizedPath(`/events/${event.slug}`, language)}>View Details</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;