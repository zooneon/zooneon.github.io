import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import StyledLink from '../utils/styled-link';
import media from '../utils/media';
import ThemeToggle from './ThemeToggle';
import { headerBackgroundColor } from '../utils/theme';

const Container = styled.nav`
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
  height: 6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${headerBackgroundColor};
  transition: all 0.3s ease;

  &.scrolled {
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1300px;
  padding: 0 2rem;
  position: relative;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.1rem;
  text-transform: uppercase;
  margin: 0;
  text-align: center;

  ${media.phone`
    font-size: 1.4rem;
  `}
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
`;

const Header = ({ title }) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <Container className={scrolled ? 'scrolled' : ''}>
      <HeaderContent>
        <StyledLink to={'/'}>
          <Title>{title}</Title>
        </StyledLink>
        <ThemeToggleWrapper>
          <ThemeToggle />
        </ThemeToggleWrapper>
      </HeaderContent>
    </Container>
  );
};

Header.defaultProps = {
  title: '',
};

Header.propTypes = {
  title: PropTypes.string,
};

export default Header;
