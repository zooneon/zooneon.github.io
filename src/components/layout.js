import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { StaticQuery, graphql } from 'gatsby';

import Header from './header';
import Tags from './tags';
import Search from './search';
import media from '../utils/media';
import ThemeProvider from '../context/ThemeContext';
import { backgroundColor, cardBorderColor } from '../utils/theme';

const Footer = styled.footer`
  display: block;
  height: 6rem;
`;

const MainContainer = styled.div`
  margin-left: 0;
  min-height: 100vh;
  position: relative;
  background-color: ${backgroundColor};
  transition: all 0.3s ease;
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
    border-bottom: 1px solid ${cardBorderColor};
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
      <ThemeProvider>
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
            </>
          )}
        />
      </ThemeProvider>
    );
  }
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
