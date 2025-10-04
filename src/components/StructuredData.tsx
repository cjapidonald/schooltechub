import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type:
    | 'Organization'
    | 'Service'
    | 'FAQPage'
    | 'BreadcrumbList'
    | 'Article'
    | 'Course'
    | 'CollectionPage';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    switch (type) {
      case 'Organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SchoolTech Hub",
          "alternateName": "STH",
          "url": "https://schooltechhub.com",
          "logo": "https://schooltechhub.com/logo.png",
          "description": "Leading AI-powered educational technology solutions for modern classrooms",
          "foundingDate": "2020",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+355-69-123-4567",
            "contactType": "customer service",
            "areaServed": ["AL", "XK", "MK", "ME"],
          "availableLanguage": ["English"]
          },
          "sameAs": [
            "https://facebook.com/schooltechhub",
            "https://twitter.com/schooltechhub",
            "https://linkedin.com/company/schooltechhub",
            "https://instagram.com/schooltechhub"
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Rruga Ismail Qemali",
            "addressLocality": "Tirana",
            "addressRegion": "Tirana",
            "postalCode": "1001",
            "addressCountry": "AL"
          }
        };
      
      case 'Service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": data.serviceType || "Educational Technology Consulting",
          "provider": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "areaServed": {
            "@type": "Country",
            "name": ["Albania", "Kosovo", "North Macedonia", "Montenegro"]
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Educational Technology Services",
            "itemListElement": data.services || [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "1:1 Consulting",
                  "description": "Personalized EdTech consulting for educators",
                  "price": "30.00",
                  "priceCurrency": "USD"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Whole School Consulting",
                  "description": "Comprehensive EdTech transformation for schools",
                  "price": "60.00",
                  "priceCurrency": "USD"
                }
              }
            ]
          }
        };
      
      case 'FAQPage':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.questions || []
        };
      
      case 'BreadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.items || []
        };
      
      case 'Article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.headline,
          "description": data.description,
          "image": data.image,
          "author": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "publisher": {
            "@type": "Organization",
            "name": "SchoolTech Hub",
            "logo": {
              "@type": "ImageObject",
              "url": "https://schooltechhub.com/logo.png"
            }
          },
          "datePublished": data.datePublished,
          "dateModified": data.dateModified || data.datePublished,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
          }
        };
      
      case 'Course':
        return {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": data.name,
          "description": data.description,
          "provider": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "educationalLevel": data.level || "Professional Development",
          "teaches": data.skills || [],
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Online",
            "duration": data.duration || "P1M"
          }
        };

      case 'CollectionPage':
        return {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": data.name,
          "description": data.description,
          "url": data.url,
          "mainEntity": Array.isArray(data.items)
            ? data.items.map((item: any) => ({
                "@type": "Article",
                "name": item.name,
                "url": item.url,
                "image": item.image,
                "datePublished": item.datePublished,
                "author": item.author
                  ? {
                      "@type": "Person",
                      "name": item.author,
                    }
                  : undefined,
              }))
            : undefined,
        };

      default:
        return null;
    }
  };

  const schema = generateSchema();
  
  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}