import React from 'react';
import PropTypes from 'prop-types';
import { useStaticQuery, graphql } from 'gatsby';

function Seo({ description, lang, meta, keywords, title }) {
  const { site } = useStaticQuery(detailsQuery);
  const metaDescription = description || site.siteMetadata.description;

  return (
    <>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={site.siteMetadata.siteUrl} />
      <meta property="og:locale" content="ko_KR" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={site.siteMetadata.author} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <link rel="icon" href="/favicon.ico" />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(`, `)} />
      )}
      {meta.map((metaItem) => (
        <meta
          key={metaItem.name || metaItem.property}
          name={metaItem.name}
          property={metaItem.property}
          content={metaItem.content}
        />
      ))}
    </>
  );
}

Seo.defaultProps = {
  lang: `ko`,
  meta: [],
  keywords: [],
};

Seo.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
};

export default Seo;

const detailsQuery = graphql`
  query DefaultSEOQuery {
    site {
      siteMetadata {
        title
        description
        author
        siteUrl
      }
    }
  }
`;
