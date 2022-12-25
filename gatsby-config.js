module.exports = {
  siteMetadata: {
    title: `zooneon's dev log`,
    description: `기록하고 공유하는 공간`,
    author: `zooneon`,
    authorTagline: '예비 개발자 권준원입니다.',
    siteUrl: `https://blog.zooneon.dev`,
    social: {
      github: `zooneon`,
      instagram: `zooneon`,
      mail: `zooneonbot@gmail.com`,
      notion: `https://zzooneon.notion.site/69fa5b3ed63d4963bdf00167d7bc68d0`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/src/content`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
              showCaptions: true,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
          `gatsby-remark-reading-time`,
          `gatsby-remark-emoji`,
        ],
      },
    },
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-catch-links`,
    {
      resolve: `gatsby-plugin-gdpr-tracking`,
      options: {
        googleAnalytics: {
          trackingId: `G-PB788GF0S1`,
        },
        googleAds: {
          trackingId: `ca-pub-8820567915675763`,
        },
      },
    },
    {
      resolve: `gatsby-plugin-robots-txt`,
      options: {
        host: `https://blog.zooneon.dev`,
        sitemap: `https://blog.zooneon.dev/sitemap.xml`,
        policy: [{ userAgent: '*', allow: '/' }],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `blog.zooneon.dev`,
        short_name: `blog.zooneon.dev`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/favicon-default.png`,
      },
    },
    'gatsby-plugin-offline',
    `gatsby-plugin-advanced-sitemap`,
  ],
};
