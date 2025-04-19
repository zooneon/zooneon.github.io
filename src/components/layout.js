import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { StaticQuery, graphql } from 'gatsby';

import Header from './header';
import Tags from './tags';
import Search from './search';
import media from '../utils/media';

const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: system;
    font-style: normal;
    font-weight: 300;
    src: local('.SFNSText-Light'), local('.HelveticaNeueDeskInterface-Light'),
      local('.LucidaGrandeUI'), local('Ubuntu Light'), local('Segoe UI Light'),
      local('Roboto-Light'), local('DroidSans'), local('Tahoma');
  }

  :root {
    font-size: 10px;
  }

  body {
    font-family: 'system';
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    color: rgba(0, 0, 0, 0.8);
    min-height: 100vh;
    position: relative;
    font-size: 1.6rem;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: sans-serif;
  }

  h2 {
    font-size: 2.5rem;
  }

  h3 {
    font-size: 2.4rem;
  }

  h4 {
    font-size: 1.6rem;
  }
  
  code {
    font-family: Menlo,Monaco,"Courier New",Courier,monospace;
    word-break: break-word;
    background-color: #7F8487;
    color: #666;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre code {
    word-break: normal;
    background-color: transparent;
    padding: 0;
  }

  :not(pre) > code[class*="language-"], pre[class*="language-text"] {
    background-color: transparent;
    color: #666;
    font-size: medium;
  }
`;

const Footer = styled.footer`
  display: block;
  height: 6rem;
`;

const MainContainer = styled.div`
  margin-left: 0;
  min-height: 100vh;
  position: relative;
`;

const ContentWrapper = styled.div`
  display: flex;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0;
  gap: 7rem;
  min-height: calc(100vh - 100px);

  ${media.tablet`
    flex-direction: column;
    min-height: auto;
    padding: 0 1rem;
  `}
`;

const TagsContainer = styled.div`
  width: 220px;
  padding: 2rem 0;
  position: sticky;
  top: 50%;
  transform: translateY(-50%);
  height: fit-content;
  max-height: 70vh;
  overflow-y: auto;
  margin-left: 1rem;

  ${media.tablet`
    width: 100%;
    position: static;
    padding: 1rem 0;
    transform: none;
    border-bottom: 1px solid #eee;
    margin-bottom: 1rem;
    max-height: none;
    margin-left: 0;
  `}
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 800px;

  ${media.tablet`
    padding: 1rem 0;
  `}
`;

class Layout extends Component {
  render() {
    const { children } = this.props;
    return (
      <StaticQuery
        query={graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
              }
            }
          }
        `}
        render={(data) => (
          <>
            <Header title={data.site.siteMetadata.title} />
            <MainContainer>
              <ContentWrapper>
                <TagsContainer>
                  <Search />
                  <Tags />
                </TagsContainer>
                <Content>
                  {children}
                  <Footer />
                </Content>
              </ContentWrapper>
            </MainContainer>
            <GlobalStyles />
          </>
        )}
      />
    );
  }
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
