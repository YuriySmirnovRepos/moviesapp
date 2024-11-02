import { Card as AntdCard, Flex, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React from "react";
import { format } from "date-fns";
import noPic from "../../assets/no-pic.jpg";
import "./card.css";
import Rate from "../rate/rated";

export default class Card extends React.Component {
  state = {
    isPosterLoaded: false,
  };

  onPosterLoaded = () => {
    this.setState({ isPosterLoaded: true });
  };

  render() {
    const { poster } = this.props;

    const posterLoader = (
      <div style={{ height: "100%", width: "185px" }}>
        <Spin
          indicator={<LoadingOutlined spin />}
          style={{ top: "50%", left: "50%" }}
        />
      </div>
    );

    return (
      <AntdCard hoverable={true} className="card">
        <Flex style={{ height: "100%" }}>
          {this.state.isPosterLoaded ? null : posterLoader}
          <img
            alt="Film poster"
            onLoad={this.onPosterLoaded}
            src={poster ?? noPic}
            className="card__cover"
            style={{ display: this.state.isPosterLoaded ? "block" : "none" }}
          />
          <CardContent cardData={this.props} />
        </Flex>
      </AntdCard>
    );
  }
}

class CardContent extends React.Component {
  constructor(props) {
    super(props);
    this.descriptionRef = React.createRef();
  }

  componentDidMount() {
    let { scrollHeight, clientHeight } = this.descriptionRef.current;
    if (scrollHeight !== clientHeight) {
      this.#truncateTxt();
    }
  }

  #truncateTxt = () => {
    const delete2words = (txt) => txt.split(" ").slice(0, -2).join(" ");

    const descRef = this.descriptionRef.current;
    if (descRef.textContent.trim() === "") {
      return;
    }

    while (descRef.scrollHeight > descRef.clientHeight) {
      descRef.textContent = delete2words(descRef.textContent);
    }
    descRef.textContent = delete2words(descRef.textContent) + "...";
  };

  renderVoteAverage = (ratingVal) => {
    let ratingColor = null;
    switch (true) {
      case ratingVal >= 0 && ratingVal <= 3:
        ratingColor = "#E90000";
        break;
      case ratingVal > 3 && ratingVal <= 5:
        ratingColor = "#E97E00";
        break;
      case ratingVal > 5 && ratingVal <= 7:
        ratingColor = "#E9D100";
        break;
      case ratingVal > 7:
        ratingColor = "#66E900";
        break;
      default:
        ratingColor = "black";
        break;
    }

    return (
      <svg
          width="32"
          height="32"
          style={{ position: "absolute", top: "10px", right: "9px" }}
        >
          <circle
            cx="16"
            cy="16"
            r="15"
            stroke={ratingColor}
            strokeWidth="2"
            fill="none"
          />
          <text x="16" y="20" textAnchor="middle" fontSize="12" fill="black">
            {parseFloat(ratingVal).toFixed(1)}
          </text>
        </svg>
    )
  }

  render() {
    let { id, name, premier, genres, description, rating, myRating, setRating } =
      this.props.cardData;

    if (!description) {
      description = "No description";
    }
    
    return (
      <div className="card__info-container">
        <h1 className="card__title">{name}</h1>

        {this.renderVoteAverage(rating)}

        <p className="card__date">
          {(premier && format(new Date(premier), "LLLL dd, yyyy")) ||
            "No premier date"}
        </p>

        <span className="card__genres">
          {genres.map((genre) => (
            <span key={genre} className="card__genre">
              {genre}
            </span>
          ))}
        </span>

        <p ref={this.descriptionRef} className="card__description">
          {description}
        </p>

        <Rate value={myRating} setRating={setRating(id)} />
      </div>
    );
  }
}
