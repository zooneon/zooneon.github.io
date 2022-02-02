module.exports = {
  siteMetadata: {
    title: `zooneon's dev log`,
    description: `기록하고 공유하는 공간`,
    author: `zooneon`,
    authorTagline: '예비 개발자 권준원입니다.',
    social: {
      github: `zooneon`,
      instagram: `zooneon`,
      mail: `zooneonbot@gmail.com`,
      notion: ``,
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
        ],
      },
    },
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-catch-links`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        //trackingId: `TRACKING ID`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `zooneon's dev log`,
        short_name: `zooneon's dev log`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/favicon-default.png`,
      },
    },
    'gatsby-plugin-offline',
  ],
};
