import styled from 'styled-components';
import { Link } from 'gatsby';
import { textColor } from './theme';

const StyledLink = styled(Link)`
  text-decoration: none;
  color: ${(props) =>
    props.theme.mode === 'light' ? textColor.light : '#64b5f6'};
  transition: color 0.2s ease;
`;

export default StyledLink;
