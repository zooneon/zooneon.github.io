module.exports = {
  siteMetadata: {
    title: `zooneon's log`,
    description: `기록하고 공유하는 공간`,
    author: `zooneon`,
    authorTagline: 'DevOps Engineer',
    siteUrl: `https://blog.zooneon.dev`,
    social: {
      github: `zooneon`,
      linkedin: `junwon-kwon-b4770025b`,
      mail: `zooneonbot@gmail.com`,
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
          `gatsby-remark-emoji`,
        ],
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-styled-components`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-catch-links`,
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
    `gatsby-plugin-sitemap`,
  ],
};
